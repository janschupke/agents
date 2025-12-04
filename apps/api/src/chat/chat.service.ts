import { Injectable, Logger } from '@nestjs/common';
import { SessionService } from '../session/session.service';
import { MessageRepository } from '../message/message.repository';
import { MessageTranslationService } from '../message-translation/message-translation.service';
import { WordTranslationService } from '../message-translation/word-translation.service';
import { SavedWordService } from '../saved-word/saved-word.service';
import { MessageRole } from '../common/enums/message-role.enum';
import {
  SessionResponseDto,
  ChatHistoryResponseDto,
  SendMessageResponseDto,
} from '../common/dto/chat.dto';
import { ChatOrchestrationService } from './services/chat-orchestration.service';
import { AgentRepository } from '../agent/agent.repository';
import { SessionRepository } from '../session/session.repository';
import {
  AgentNotFoundException,
  SessionNotFoundException,
} from '../common/exceptions';

/**
 * Facade service for chat operations
 * Delegates to specialized services for orchestration and business logic
 */
@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly chatOrchestrationService: ChatOrchestrationService,
    private readonly sessionService: SessionService,
    private readonly messageRepository: MessageRepository,
    private readonly messageTranslationService: MessageTranslationService,
    private readonly wordTranslationService: WordTranslationService,
    private readonly savedWordService: SavedWordService,
    private readonly agentRepository: AgentRepository,
    private readonly sessionRepository: SessionRepository
  ) {}

  async getSessions(
    agentId: number,
    userId: string
  ): Promise<SessionResponseDto[]> {
    this.logger.debug(`Getting sessions for agent ${agentId}, user ${userId}`);
    return this.sessionService.getSessions(agentId, userId);
  }

  async createSession(
    agentId: number,
    userId: string
  ): Promise<SessionResponseDto> {
    this.logger.log(`Creating session for agent ${agentId}, user ${userId}`);
    return this.sessionService.createSession(agentId, userId);
  }

  async getChatHistory(
    agentId: number,
    userId: string,
    sessionId?: number
  ): Promise<ChatHistoryResponseDto> {
    this.logger.debug(
      `Getting chat history for agent ${agentId}, user ${userId}, sessionId: ${sessionId || 'latest'} (loading all messages)`
    );
    // Load agent with config
    const agent = await this.agentRepository.findByIdWithConfig(
      agentId,
      userId
    );
    if (!agent) {
      throw new AgentNotFoundException(agentId);
    }

    // Get session (don't create - session creation only happens in sendMessage)
    let session;
    if (sessionId) {
      session = await this.sessionRepository.findByIdAndUserId(
        sessionId,
        userId
      );
      if (!session || session.agentId !== agentId) {
        throw new SessionNotFoundException(sessionId);
      }
    } else {
      // If no sessionId provided, find latest session but don't create one
      session = await this.sessionRepository.findLatestByAgentId(
        agentId,
        userId
      );
      // If no session exists, return empty history instead of creating one
      if (!session) {
        return {
          agent: {
            id: agent.id,
            name: agent.name,
            description: agent.description,
          },
          session: null,
          messages: [],
          savedWordMatches: [],
          hasMore: false,
        };
      }
    }

    // Load all messages (no pagination) - use withRawData to get all fields
    const messageRecords =
      await this.messageRepository.findAllBySessionIdWithRawData(
        session.id
        // No limit - loads all messages (default limit is 1000, which should be enough)
      );

    // Get all message IDs
    const messageIds = messageRecords.map((m) => m.id);

    // Load translations for all messages
    const translations =
      await this.messageTranslationService.getTranslationsForMessages(
        messageIds
      );

    // Get word translations for assistant messages
    const assistantMessageIds = messageRecords
      .filter((m) => m.role === MessageRole.ASSISTANT)
      .map((m) => m.id);

    const wordTranslations =
      await this.wordTranslationService.getWordTranslationsForMessages(
        assistantMessageIds
      );

    // Find saved word matches for all words in assistant messages
    let savedWordMatches: Array<{
      originalWord: string;
      savedWordId: number;
      translation: string;
      pinyin: string | null;
    }> = [];
    try {
      // Extract all unique words from word translations
      const allWords = new Set<string>();
      wordTranslations.forEach((wts) => {
        wts.forEach((wt) => {
          allWords.add(wt.originalWord);
        });
      });

      if (allWords.size > 0) {
        savedWordMatches = await this.savedWordService.findMatchingWords(
          userId,
          Array.from(allWords)
        );
        this.logger.debug(
          `Found ${savedWordMatches.length} saved word matches for session ${session.id}`
        );
      }
    } catch (error) {
      this.logger.error('Error finding saved word matches:', error);
      // Continue without saved word matches
    }

    const messages = messageRecords.map(
      (msg: {
        id: number;
        role: string;
        content: string;
        rawRequest?: unknown;
        rawResponse?: unknown;
      }) => {
        const baseMessage = {
          id: msg.id,
          role: msg.role as MessageRole,
          content: msg.content,
          rawRequest: msg.rawRequest,
          rawResponse: msg.rawResponse,
          translation: translations.get(msg.id),
        };

        // Add word translations for assistant messages
        if (msg.role === MessageRole.ASSISTANT) {
          return {
            ...baseMessage,
            wordTranslations: wordTranslations.get(msg.id) || [],
          };
        }

        return baseMessage;
      }
    );

    return {
      agent: {
        id: agent.id,
        name: agent.name,
        description: agent.description,
      },
      session: {
        id: session.id,
        session_name: session.sessionName,
      },
      messages,
      savedWordMatches,
      hasMore: false, // No pagination, always false
    };
  }

  async sendMessage(
    agentId: number,
    userId: string,
    message: string,
    sessionId?: number
  ): Promise<SendMessageResponseDto> {
    return this.chatOrchestrationService.sendMessage({
      agentId,
      userId,
      message,
      sessionId,
    });
  }

  async updateSession(
    agentId: number,
    sessionId: number,
    userId: string,
    sessionName?: string
  ): Promise<SessionResponseDto> {
    this.logger.log(
      `Updating session ${sessionId} for agent ${agentId}, user ${userId}`
    );
    return this.sessionService.updateSession(
      agentId,
      sessionId,
      userId,
      sessionName
    );
  }

  async deleteSession(
    agentId: number,
    sessionId: number,
    userId: string
  ): Promise<void> {
    this.logger.log(
      `Deleting session ${sessionId} for agent ${agentId}, user ${userId}`
    );
    return this.sessionService.deleteSession(agentId, sessionId, userId);
  }
}
