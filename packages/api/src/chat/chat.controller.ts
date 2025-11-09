import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  HttpException,
  HttpStatus,
  Query,
  Request,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { SendMessageDto } from '../common/dto/send-message.dto';
import { UserService } from '../user/user.service';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    imageUrl?: string | null;
    roles?: string[];
  };
}

@Controller('api/chat')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly userService: UserService,
  ) {}

  private async ensureUser(req: AuthenticatedRequest) {
    const perfStart = Date.now();
    if (!req.user?.id) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }
    
    // Sync user to DB (including roles) - roles are now included in the upsert
    // This eliminates the need for a separate syncRolesFromClerk call
    const findOrCreateStart = Date.now();
    await this.userService.findOrCreate({
      id: req.user.id,
      email: req.user.email || undefined,
      firstName: req.user.firstName || undefined,
      lastName: req.user.lastName || undefined,
      imageUrl: req.user.imageUrl || undefined,
      roles: req.user.roles || ['user'],
    });
    const findOrCreateTime = Date.now() - findOrCreateStart;
    if (findOrCreateTime > 50) {
      console.log(`[Performance] ChatController.ensureUser findOrCreate took ${findOrCreateTime}ms`);
    }
    
    const totalTime = Date.now() - perfStart;
    if (totalTime > 100) {
      console.log(`[Performance] ChatController.ensureUser COMPLETE - total: ${totalTime}ms`);
    }
    return req.user.id;
  }

  @Get(':botId/sessions')
  async getSessions(
    @Param('botId', ParseIntPipe) botId: number,
    @Request() req: AuthenticatedRequest,
  ) {
    try {
      const userId = await this.ensureUser(req);
      return await this.chatService.getSessions(botId, userId);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      const err = error as { message?: string };
      throw new HttpException(
        err.message || 'Unknown error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':botId/sessions')
  async createSession(
    @Param('botId', ParseIntPipe) botId: number,
    @Request() req: AuthenticatedRequest,
  ) {
    try {
      const userId = await this.ensureUser(req);
      return await this.chatService.createSession(botId, userId);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      const err = error as { message?: string };
      throw new HttpException(
        err.message || 'Unknown error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':botId')
  async getChatHistory(
    @Param('botId', ParseIntPipe) botId: number,
    @Request() req: AuthenticatedRequest,
    @Query('sessionId') sessionId?: string,
  ) {
    const perfStart = Date.now();
    console.log(`[Performance] ChatController.getChatHistory START - botId: ${botId}, sessionId: ${sessionId}`);
    
    try {
      const ensureUserStart = Date.now();
      const userId = await this.ensureUser(req);
      const ensureUserTime = Date.now() - ensureUserStart;
      if (ensureUserTime > 50) {
        console.log(`[Performance] ChatController.getChatHistory ensureUser took ${ensureUserTime}ms`);
      }
      
      const parsedSessionId = sessionId ? parseInt(sessionId, 10) : undefined;
      const serviceStart = Date.now();
      const result = await this.chatService.getChatHistory(botId, userId, parsedSessionId);
      const serviceTime = Date.now() - serviceStart;
      const totalTime = Date.now() - perfStart;
      console.log(`[Performance] ChatController.getChatHistory COMPLETE - total: ${totalTime}ms (ensureUser: ${ensureUserTime}ms, service: ${serviceTime}ms), messages: ${result.messages?.length || 0}`);
      return result;
    } catch (error) {
      const errorTime = Date.now() - perfStart;
      console.error(`[Performance] ChatController.getChatHistory ERROR after ${errorTime}ms:`, error);
      if (error instanceof HttpException) {
        throw error;
      }
      const err = error as { message?: string };
      throw new HttpException(
        err.message || 'Unknown error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':botId')
  async sendMessage(
    @Param('botId', ParseIntPipe) botId: number,
    @Body() body: SendMessageDto,
    @Request() req: AuthenticatedRequest,
    @Query('sessionId') sessionId?: string,
  ) {
    if (!body.message || typeof body.message !== 'string') {
      throw new HttpException(
        'Message is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const userId = await this.ensureUser(req);
      const parsedSessionId = sessionId ? parseInt(sessionId, 10) : undefined;
      return await this.chatService.sendMessage(botId, userId, body.message, parsedSessionId);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      const err = error as { message?: string; status?: number };
      if (err.status === 401) {
        throw new HttpException(
          'Invalid API key. Please check your .env file.',
          HttpStatus.UNAUTHORIZED,
        );
      }
      throw new HttpException(
        err.message || 'Unknown error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':botId/sessions/:sessionId')
  async deleteSession(
    @Param('botId', ParseIntPipe) botId: number,
    @Param('sessionId', ParseIntPipe) sessionId: number,
    @Request() req: AuthenticatedRequest,
  ) {
    try {
      const userId = await this.ensureUser(req);
      await this.chatService.deleteSession(botId, sessionId, userId);
      return { success: true };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      const err = error as { message?: string };
      throw new HttpException(
        err.message || 'Unknown error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
