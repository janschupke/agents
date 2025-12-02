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
import { API_ROUTES } from '../common/constants/api-routes.constants.js';

@Controller(API_ROUTES.CHAT.BASE)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get(':agentId/sessions')
  async getSessions(
    @Param('agentId', ParseIntPipe) agentId: number,
    @User() user: AuthenticatedUser
  ): Promise<SessionResponseDto[]> {
    try {
      return await this.chatService.getSessions(agentId, user.id);
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

  @Post(':agentId/sessions')
  async createSession(
    @Param('agentId', ParseIntPipe) agentId: number,
    @User() user: AuthenticatedUser
  ): Promise<SessionResponseDto> {
    try {
      return await this.chatService.createSession(agentId, user.id);
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

  @Get(':agentId')
  async getChatHistory(
    @Param('agentId', ParseIntPipe) agentId: number,
    @User() user: AuthenticatedUser,
    @Query('sessionId') sessionId?: string
  ): Promise<ChatHistoryResponseDto> {
    try {
      const parsedSessionId = sessionId ? parseInt(sessionId, 10) : undefined;
      return await this.chatService.getChatHistory(
        agentId,
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

  @Post(':agentId')
  async sendMessage(
    @Param('agentId', ParseIntPipe) agentId: number,
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
        agentId,
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

  @Put(':agentId/sessions/:sessionId')
  async updateSession(
    @Param('agentId', ParseIntPipe) agentId: number,
    @Param('sessionId', ParseIntPipe) sessionId: number,
    @Body() body: UpdateSessionDto,
    @User() user: AuthenticatedUser
  ): Promise<SessionResponseDto> {
    try {
      return await this.chatService.updateSession(
        agentId,
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

  @Delete(':agentId/sessions/:sessionId')
  async deleteSession(
    @Param('agentId', ParseIntPipe) agentId: number,
    @Param('sessionId', ParseIntPipe) sessionId: number,
    @User() user: AuthenticatedUser
  ): Promise<SuccessResponseDto> {
    try {
      await this.chatService.deleteSession(agentId, sessionId, user.id);
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
