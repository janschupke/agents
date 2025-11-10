import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  HttpException,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import {
  SendMessageDto,
  SessionResponseDto,
  ChatHistoryResponseDto,
  SendMessageResponseDto,
  UpdateSessionDto,
} from '../common/dto/chat.dto';
import { User } from '../auth/decorators/user.decorator';
import { AuthenticatedUser } from '../common/types/auth.types';
import { SuccessResponseDto } from '../common/dto/common.dto';

@Controller('api/chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get(':botId/sessions')
  async getSessions(
    @Param('botId', ParseIntPipe) botId: number,
    @User() user: AuthenticatedUser
  ): Promise<SessionResponseDto[]> {
    try {
      return await this.chatService.getSessions(botId, user.id);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      const err = error as { message?: string };
      throw new HttpException(
        err.message || 'Unknown error',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post(':botId/sessions')
  async createSession(
    @Param('botId', ParseIntPipe) botId: number,
    @User() user: AuthenticatedUser
  ): Promise<SessionResponseDto> {
    try {
      return await this.chatService.createSession(botId, user.id);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      const err = error as { message?: string };
      throw new HttpException(
        err.message || 'Unknown error',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(':botId')
  async getChatHistory(
    @Param('botId', ParseIntPipe) botId: number,
    @User() user: AuthenticatedUser,
    @Query('sessionId') sessionId?: string
  ): Promise<ChatHistoryResponseDto> {
    try {
      const parsedSessionId = sessionId ? parseInt(sessionId, 10) : undefined;
      return await this.chatService.getChatHistory(
        botId,
        user.id,
        parsedSessionId
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      const err = error as { message?: string };
      throw new HttpException(
        err.message || 'Unknown error',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post(':botId')
  async sendMessage(
    @Param('botId', ParseIntPipe) botId: number,
    @Body() body: SendMessageDto,
    @User() user: AuthenticatedUser,
    @Query('sessionId') sessionId?: string
  ): Promise<SendMessageResponseDto> {
    if (!body.message || typeof body.message !== 'string') {
      throw new HttpException('Message is required', HttpStatus.BAD_REQUEST);
    }

    try {
      const parsedSessionId = sessionId ? parseInt(sessionId, 10) : undefined;
      return await this.chatService.sendMessage(
        botId,
        user.id,
        body.message,
        parsedSessionId
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      const err = error as { message?: string; status?: number };
      if (err.status === 401) {
        throw new HttpException(
          'Invalid API key. Please check your .env file.',
          HttpStatus.UNAUTHORIZED
        );
      }
      throw new HttpException(
        err.message || 'Unknown error',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Put(':botId/sessions/:sessionId')
  async updateSession(
    @Param('botId', ParseIntPipe) botId: number,
    @Param('sessionId', ParseIntPipe) sessionId: number,
    @Body() body: UpdateSessionDto,
    @User() user: AuthenticatedUser
  ): Promise<SessionResponseDto> {
    try {
      return await this.chatService.updateSession(
        botId,
        sessionId,
        user.id,
        body.session_name
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      const err = error as { message?: string };
      throw new HttpException(
        err.message || 'Unknown error',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Delete(':botId/sessions/:sessionId')
  async deleteSession(
    @Param('botId', ParseIntPipe) botId: number,
    @Param('sessionId', ParseIntPipe) sessionId: number,
    @User() user: AuthenticatedUser
  ): Promise<SuccessResponseDto> {
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
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
