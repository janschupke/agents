import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { AgentRepository } from '../agent/agent.repository';
import { SessionRepository } from '../session/session.repository';
import { MessageRepository } from '../message/message.repository';
import { AgentMemoryService } from '../memory/agent-memory.service';
import { AgentMemoryRepository } from '../memory/agent-memory.repository';
import { OpenAIService } from '../openai/openai.service';
import { UserService } from '../user/user.service';
import { ApiCredentialsService } from '../api-credentials/api-credentials.service';
import { SystemConfigRepository } from '../system-config/system-config.repository';
import { MessageTranslationService } from '../message-translation/message-translation.service';
import { WordTranslationService } from '../message-translation/word-translation.service';
import { MessageRole } from '../common/enums/message-role.enum';
import { MEMORY_CONFIG } from '../common/constants/api.constants.js';
import { BehaviorRulesUtil } from '../common/utils/behavior-rules.util.js';
import { OPENAI_PROMPTS } from '../common/constants/openai-prompts.constants.js';
import { NUMERIC_CONSTANTS } from '../common/constants/numeric.constants.js';
import {
  SessionResponseDto,
  ChatHistoryResponseDto,
  SendMessageResponseDto,
} from '../common/dto/chat.dto';

@Injectable()
export class ChatService {
  constructor(
    private readonly agentRepository: AgentRepository,
    private readonly sessionRepository: SessionRepository,
    private readonly messageRepository: MessageRepository,
    private readonly agentMemoryService: AgentMemoryService,
    private readonly agentMemoryRepository: AgentMemoryRepository,
    private readonly openaiService: OpenAIService,
    private readonly userService: UserService,
    private readonly apiCredentialsService: ApiCredentialsService,
    private readonly systemConfigRepository: SystemConfigRepository,
    private readonly messageTranslationService: MessageTranslationService,
    private readonly wordTranslationService: WordTranslationService
  ) {}

  async getSessions(
    agentId: number,
    userId: string
  ): Promise<SessionResponseDto[]> {
    // Load agent with config
    const agent = await this.agentRepository.findByIdWithConfig(agentId, userId);
    if (!agent) {
      throw new HttpException('Agent not found', HttpStatus.NOT_FOUND);
    }

    // Get all sessions for this agent and user
    const sessions = await this.sessionRepository.findAllByAgentId(agentId, userId);

    return sessions.map((session) => ({
      id: session.id,
      session_name: session.sessionName,
      createdAt: session.createdAt,
    }));
  }

  async createSession(
    agentId: number,
    userId: string
  ): Promise<SessionResponseDto> {
    // User is automatically synced to DB by ClerkGuard

    // Load agent with config
    const agent = await this.agentRepository.findByIdWithConfig(agentId, userId);
    if (!agent) {
      throw new HttpException('Agent not found', HttpStatus.NOT_FOUND);
    }

    // Create new session
    const session = await this.sessionRepository.create(userId, agentId);

    return {
      id: session.id,
      session_name: session.sessionName,
      createdAt: session.createdAt,
    };
  }

  async getChatHistory(
    agentId: number,
    userId: string,
    sessionId?: number
  ): Promise<ChatHistoryResponseDto> {
    // Load agent with config
    const agent = await this.agentRepository.findByIdWithConfig(agentId, userId);
    if (!agent) {
      throw new HttpException('Agent not found', HttpStatus.NOT_FOUND);
    }

    // Get or create session
    let session;
    if (sessionId) {
      session = await this.sessionRepository.findByIdAndUserId(
        sessionId,
        userId
      );
      if (!session || session.agentId !== agentId) {
        throw new HttpException('Session not found', HttpStatus.NOT_FOUND);
      }
    } else {
      session = await this.sessionRepository.findLatestByAgentId(agentId, userId);
      if (!session) {
        session = await this.sessionRepository.create(userId, agentId);
      }
    }

    // Load messages with raw data
    const messageRecords =
      await this.messageRepository.findAllBySessionIdWithRawData(session.id);

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
    };
  }

  async sendMessage(
    agentId: number,
    userId: string,
    message: string,
    sessionId?: number
  ): Promise<SendMessageResponseDto> {
    // User is automatically synced to DB by ClerkGuard

    // Check if user has API key
    const apiKey = await this.apiCredentialsService.getApiKey(userId, 'openai');
    if (!apiKey) {
      throw new HttpException(
        'OpenAI API key is required. Please set your API key in your profile.',
        HttpStatus.BAD_REQUEST
      );
    }

    // Load agent with config
    const agent = await this.agentRepository.findByIdWithConfig(agentId, userId);
    if (!agent) {
      throw new HttpException('Agent not found', HttpStatus.NOT_FOUND);
    }

    const agentConfig = this.agentRepository.mergeAgentConfig(agent.configs);

    // Get or create session
    let session;
    if (sessionId) {
      session = await this.sessionRepository.findByIdAndUserId(
        sessionId,
        userId
      );
      if (!session || session.agentId !== agentId) {
        throw new HttpException('Session not found', HttpStatus.NOT_FOUND);
      }
    } else {
      session = await this.sessionRepository.findLatestByAgentId(agentId, userId);
      if (!session) {
        session = await this.sessionRepository.create(userId, agentId);
      }
    }

    // Load existing messages
    const existingMessages =
      await this.messageRepository.findAllBySessionIdForOpenAI(session.id);

    // Retrieve relevant memories using vector similarity
    let relevantMemories: string[] = [];
    try {
      relevantMemories = await this.agentMemoryService.getMemoriesForContext(
        agentId,
        userId,
        message,
        apiKey
      );
      if (relevantMemories.length > 0) {
        console.log(
          `Found ${relevantMemories.length} relevant memories for agent ${agentId}`
        );
      }
    } catch (error) {
      console.error('Error retrieving memories:', error);
      // Continue without memories if retrieval fails
    }

    // Prepare messages for OpenAI
    const messagesForAPI = [...existingMessages];

    // Add memory context if found
    if (relevantMemories.length > 0) {
      const memoryContext = `Relevant context from previous conversations:\n${relevantMemories
        .map((m, i) => `${i + 1}. ${m}`)
        .join('\n\n')}`;

      const systemMessages = messagesForAPI.filter((m) => m.role === 'system');
      const nonSystemMessages = messagesForAPI.filter(
        (m) => m.role !== 'system'
      );

      messagesForAPI.length = 0;
      messagesForAPI.push(...systemMessages);
      messagesForAPI.push({
        role: 'system',
        content: memoryContext,
      });
      messagesForAPI.push(...nonSystemMessages);
    }

    // Add system prompt if not already present
    if (agentConfig.system_prompt) {
      const systemPrompt = String(agentConfig.system_prompt);
      if (
        !messagesForAPI.some(
          (m) => m.role === 'system' && m.content === systemPrompt
        )
      ) {
        messagesForAPI.unshift({
          role: 'system',
          content: systemPrompt,
        });
      }
    }

    // Add system-wide behavior rules FIRST (these cannot be overridden)
    let systemBehaviorRules: string[] = [];
    try {
      const systemConfig = await this.systemConfigRepository.findByKey('behavior_rules');
      if (systemConfig && systemConfig.configValue) {
        systemBehaviorRules = BehaviorRulesUtil.parse(systemConfig.configValue);
      }
    } catch (error) {
      console.error('Error loading system behavior rules:', error);
      // Continue without system rules if loading fails
    }

    if (systemBehaviorRules.length > 0) {
      const systemBehaviorRulesMessage = BehaviorRulesUtil.formatSystemRules(systemBehaviorRules);

      if (systemBehaviorRulesMessage.length > 0) {
        // Check if system behavior rules are already present
        if (
          !messagesForAPI.some(
            (m) => m.role === 'system' && m.content === systemBehaviorRulesMessage
          )
        ) {
          // Add system behavior rules after system prompt but before agent-specific rules
          const systemPromptIndex = messagesForAPI.findIndex(
            (m) =>
              m.role === 'system' &&
              m.content === String(agentConfig.system_prompt || '')
          );

          if (systemPromptIndex >= 0) {
            // Insert after system prompt
            messagesForAPI.splice(systemPromptIndex + 1, 0, {
              role: 'system',
              content: systemBehaviorRulesMessage,
            });
          } else {
            // No system prompt found, add at the beginning
            messagesForAPI.unshift({
              role: 'system',
              content: systemBehaviorRulesMessage,
            });
          }
        }
      }
    }

    // Add agent-specific behavior rules (these are additional to system rules)
    if (agentConfig.behavior_rules) {
      const behaviorRules = BehaviorRulesUtil.parse(agentConfig.behavior_rules);

      // Format behavior rules as a system message
      if (behaviorRules.length > 0) {
        const behaviorRulesMessage = BehaviorRulesUtil.formatAgentRules(behaviorRules);

        if (behaviorRulesMessage.length > 0) {
          // Check if behavior rules are already present (exact match)
          if (
            !messagesForAPI.some(
              (m) => m.role === 'system' && m.content === behaviorRulesMessage
            )
          ) {
            // Add behavior rules after system prompt but before other system messages
            const systemPromptIndex = messagesForAPI.findIndex(
              (m) =>
                m.role === 'system' &&
                m.content === String(agentConfig.system_prompt || '')
              );

            if (systemPromptIndex >= 0) {
              // Insert after system prompt
              messagesForAPI.splice(systemPromptIndex + 1, 0, {
                role: 'system',
                content: behaviorRulesMessage,
              });
            } else {
              // No system prompt found, add at the beginning
              messagesForAPI.unshift({
                role: 'system',
                content: behaviorRulesMessage,
              });
            }
          }
        }
      }
    }

    // Add user message
    messagesForAPI.push({
      role: 'user',
      content: message,
    });

    // Prepare OpenAI API request
    const openaiRequest = {
      model: String(agentConfig.model || 'gpt-4o-mini'),
      messages: messagesForAPI,
      temperature: Number(agentConfig.temperature || NUMERIC_CONSTANTS.DEFAULT_TEMPERATURE),
      max_tokens: agentConfig.max_tokens
        ? Number(agentConfig.max_tokens)
        : undefined,
    };

    // Save user message to database with raw request
    const userMessage = await this.messageRepository.create(
      session.id,
      'user',
      message,
      undefined,
      openaiRequest,
      undefined
    );

    // Call OpenAI API with user's API key
    const openai = this.openaiService.getClient(apiKey);
    const completion = await openai.chat.completions.create(openaiRequest);

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new HttpException(
        'No response from OpenAI',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }

    // Save assistant message to database with raw response
    const assistantMessage = await this.messageRepository.create(
      session.id,
      'assistant',
      response,
      {
        model: agentConfig.model,
        temperature: agentConfig.temperature,
      },
      undefined,
      completion
    );

    // Translations are now on-demand only - no automatic background translation

    // Save memory periodically (every N messages, or on first message)
    const allMessages =
      await this.messageRepository.findAllBySessionIdForOpenAI(session.id);
    const shouldSaveMemory =
      allMessages.length === 1 || // Save on first message
      (allMessages.length > 0 &&
        allMessages.length % MEMORY_CONFIG.MEMORY_SAVE_INTERVAL === 0);

    if (shouldSaveMemory) {
      try {
        await this.agentMemoryService.createMemory(
          agentId,
          userId,
          session.id,
          session.sessionName,
          allMessages,
          apiKey
        );

        // Check if summarization is needed
        const shouldSummarize =
          await this.agentMemoryService.shouldSummarize(agentId, userId);
        if (shouldSummarize) {
          // Run summarization asynchronously (don't wait)
          this.agentMemoryService
            .summarizeMemories(agentId, userId, apiKey)
            .catch((error) => {
              console.error('Error during memory summarization:', error);
            });
        }

        console.log(
          `Saved memories for agent ${agentId}, session ${session.id} (${allMessages.length} messages)`
        );
      } catch (error) {
        console.error('Error saving memories:', error);
        // Continue even if memory save fails
      }
    }

    return {
      response,
      session: {
        id: session.id,
        session_name: session.sessionName,
      },
      rawRequest: openaiRequest,
      rawResponse: completion,
      userMessageId: userMessage.id,
      assistantMessageId: assistantMessage.id,
    };
  }

  async updateSession(
    agentId: number,
    sessionId: number,
    userId: string,
    sessionName?: string
  ): Promise<SessionResponseDto> {
    // Verify the agent belongs to the user
    const agent = await this.agentRepository.findByIdAndUserId(agentId, userId);
    if (!agent) {
      throw new HttpException('Agent not found', HttpStatus.NOT_FOUND);
    }

    // Verify the session belongs to the agent and user
    const session = await this.sessionRepository.findByIdAndUserId(
      sessionId,
      userId
    );
    if (!session) {
      throw new HttpException('Session not found', HttpStatus.NOT_FOUND);
    }

    if (session.agentId !== agentId) {
      throw new HttpException(
        'Session does not belong to this agent',
        HttpStatus.BAD_REQUEST
      );
    }

    // Update the session
    const updated = await this.sessionRepository.update(
      sessionId,
      userId,
      sessionName
    );

    return {
      id: updated.id,
      session_name: updated.sessionName,
      createdAt: updated.createdAt,
    };
  }

  async deleteSession(
    agentId: number,
    sessionId: number,
    userId: string
  ): Promise<void> {
    // Verify the agent belongs to the user
    const agent = await this.agentRepository.findByIdAndUserId(agentId, userId);
    if (!agent) {
      throw new HttpException('Agent not found', HttpStatus.NOT_FOUND);
    }

    // Verify the session belongs to the agent and user
    const session = await this.sessionRepository.findByIdAndUserId(
      sessionId,
      userId
    );
    if (!session) {
      throw new HttpException('Session not found', HttpStatus.NOT_FOUND);
    }

    if (session.agentId !== agentId) {
      throw new HttpException(
        'Session does not belong to this agent',
        HttpStatus.BAD_REQUEST
      );
    }

    // Delete the session - Prisma will cascade delete all related data (messages, memory chunks)
    await this.sessionRepository.delete(sessionId, userId);
  }

}
