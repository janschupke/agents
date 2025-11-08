import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  ParseIntPipe,
  HttpException,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { SendMessageDto } from '../common/dto/send-message.dto';

@Controller('api/chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get(':botId/sessions')
  async getSessions(@Param('botId', ParseIntPipe) botId: number) {
    try {
      return await this.chatService.getSessions(botId);
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
  async createSession(@Param('botId', ParseIntPipe) botId: number) {
    try {
      return await this.chatService.createSession(botId);
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
    @Query('sessionId') sessionId?: string,
  ) {
    try {
      const parsedSessionId = sessionId ? parseInt(sessionId, 10) : undefined;
      return await this.chatService.getChatHistory(botId, parsedSessionId);
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

  @Post(':botId')
  async sendMessage(
    @Param('botId', ParseIntPipe) botId: number,
    @Body() body: SendMessageDto,
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
      return await this.chatService.sendMessage(botId, body.message, parsedSessionId);
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
}
