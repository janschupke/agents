import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  Query,
  Logger,
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
import { MAGIC_STRINGS } from '../common/constants/error-messages.constants.js';

@Controller(API_ROUTES.CHAT.BASE)
export class ChatController {
  private readonly logger = new Logger(ChatController.name);

  constructor(private readonly chatService: ChatService) {}

  @Get(':agentId/sessions')
  async getSessions(
    @Param('agentId', ParseIntPipe) agentId: number,
    @User() user: AuthenticatedUser
  ): Promise<SessionResponseDto[]> {
    this.logger.log(`Getting sessions for agent ${agentId}, user ${user.id}`);
    return await this.chatService.getSessions(agentId, user.id);
  }

  @Post(':agentId/sessions')
  async createSession(
    @Param('agentId', ParseIntPipe) agentId: number,
    @User() user: AuthenticatedUser
  ): Promise<SessionResponseDto> {
    this.logger.log(`Creating session for agent ${agentId}, user ${user.id}`);
    return await this.chatService.createSession(agentId, user.id);
  }

  @Get(':agentId')
  async getChatHistory(
    @Param('agentId', ParseIntPipe) agentId: number,
    @User() user: AuthenticatedUser,
    @Query('sessionId') sessionId?: string,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string
  ): Promise<ChatHistoryResponseDto> {
    const parsedSessionId = sessionId
      ? parseInt(sessionId, MAGIC_STRINGS.PARSE_INT_BASE)
      : undefined;
    const parsedLimit = limit
      ? parseInt(limit, MAGIC_STRINGS.PARSE_INT_BASE)
      : 20; // Default to 20 messages
    const parsedCursor = cursor
      ? parseInt(cursor, MAGIC_STRINGS.PARSE_INT_BASE)
      : undefined;
    this.logger.debug(
      `Getting chat history for agent ${agentId}, user ${user.id}, sessionId: ${parsedSessionId || 'latest'}, limit: ${parsedLimit}, cursor: ${parsedCursor || 'none'}`
    );
    return await this.chatService.getChatHistory(
      agentId,
      user.id,
      parsedSessionId,
      parsedLimit,
      parsedCursor
    );
  }

  @Post(':agentId')
  async sendMessage(
    @Param('agentId', ParseIntPipe) agentId: number,
    @Body() body: SendMessageDto,
    @User() user: AuthenticatedUser,
    @Query('sessionId') sessionId?: string
  ): Promise<SendMessageResponseDto> {
    // DTO validation is handled by ValidationPipe
    const parsedSessionId = sessionId
      ? parseInt(sessionId, MAGIC_STRINGS.PARSE_INT_BASE)
      : undefined;
    this.logger.log(
      `Sending message for agent ${agentId}, user ${user.id}, sessionId: ${parsedSessionId || 'new'}`
    );
    // Exception filter will handle any errors
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
