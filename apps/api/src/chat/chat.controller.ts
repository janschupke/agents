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
import { ERROR_MESSAGES, MAGIC_STRINGS } from '../common/constants/error-messages.constants.js';

@Controller(API_ROUTES.CHAT.BASE)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get(':agentId/sessions')
  async getSessions(
    @Param('agentId', ParseIntPipe) agentId: number,
    @User() user: AuthenticatedUser
  ): Promise<SessionResponseDto[]> {
    return await this.chatService.getSessions(agentId, user.id);
  }

  @Post(':agentId/sessions')
  async createSession(
    @Param('agentId', ParseIntPipe) agentId: number,
    @User() user: AuthenticatedUser
  ): Promise<SessionResponseDto> {
    return await this.chatService.createSession(agentId, user.id);
  }

  @Get(':agentId')
  async getChatHistory(
    @Param('agentId', ParseIntPipe) agentId: number,
    @User() user: AuthenticatedUser,
    @Query('sessionId') sessionId?: string
  ): Promise<ChatHistoryResponseDto> {
    const parsedSessionId = sessionId
      ? parseInt(sessionId, MAGIC_STRINGS.PARSE_INT_BASE)
      : undefined;
    return await this.chatService.getChatHistory(
      agentId,
      user.id,
      parsedSessionId
    );
  }

  @Post(':agentId')
  async sendMessage(
    @Param('agentId', ParseIntPipe) agentId: number,
    @Body() body: SendMessageDto,
    @User() user: AuthenticatedUser,
    @Query('sessionId') sessionId?: string
  ): Promise<SendMessageResponseDto> {
    const parsedSessionId = sessionId
      ? parseInt(sessionId, MAGIC_STRINGS.PARSE_INT_BASE)
      : undefined;
    return await this.chatService.sendMessage(
      agentId,
      user.id,
      body.message,
      parsedSessionId
    );
  }

  @Put(':agentId/sessions/:sessionId')
  async updateSession(
    @Param('agentId', ParseIntPipe) agentId: number,
    @Param('sessionId', ParseIntPipe) sessionId: number,
    @Body() body: UpdateSessionDto,
    @User() user: AuthenticatedUser
  ): Promise<SessionResponseDto> {
    return await this.chatService.updateSession(
      agentId,
      sessionId,
      user.id,
      body.session_name
    );
  }

  @Delete(':agentId/sessions/:sessionId')
  async deleteSession(
    @Param('agentId', ParseIntPipe) agentId: number,
    @Param('sessionId', ParseIntPipe) sessionId: number,
    @User() user: AuthenticatedUser
  ): Promise<SuccessResponseDto> {
    await this.chatService.deleteSession(agentId, sessionId, user.id);
    return { success: true };
  }
}
