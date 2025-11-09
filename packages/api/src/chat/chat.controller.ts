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
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { SendMessageDto } from '../common/dto/send-message.dto';
import { User } from '../auth/decorators/user.decorator';
import { AuthenticatedUser } from '../common/types/auth.types';

@Controller('api/chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get(':botId/sessions')
  async getSessions(
    @Param('botId', ParseIntPipe) botId: number,
    @User() user: AuthenticatedUser,
  ) {
    try {
      return await this.chatService.getSessions(botId, user.id);
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
    @User() user: AuthenticatedUser,
  ) {
    try {
      return await this.chatService.createSession(botId, user.id);
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
    @User() user: AuthenticatedUser,
    @Query('sessionId') sessionId?: string,
  ) {
    const perfStart = Date.now();
    console.log(`[Performance] ChatController.getChatHistory START - botId: ${botId}, sessionId: ${sessionId}`);
    
    try {
      const parsedSessionId = sessionId ? parseInt(sessionId, 10) : undefined;
      const serviceStart = Date.now();
      const result = await this.chatService.getChatHistory(botId, user.id, parsedSessionId);
      const serviceTime = Date.now() - serviceStart;
      const totalTime = Date.now() - perfStart;
      console.log(`[Performance] ChatController.getChatHistory COMPLETE - total: ${totalTime}ms (service: ${serviceTime}ms), messages: ${result.messages?.length || 0}`);
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
    @User() user: AuthenticatedUser,
    @Query('sessionId') sessionId?: string,
  ) {
    if (!body.message || typeof body.message !== 'string') {
      throw new HttpException(
        'Message is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const parsedSessionId = sessionId ? parseInt(sessionId, 10) : undefined;
      return await this.chatService.sendMessage(botId, user.id, body.message, parsedSessionId);
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
    @User() user: AuthenticatedUser,
  ) {
    try {
      await this.chatService.deleteSession(botId, sessionId, user.id);
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
