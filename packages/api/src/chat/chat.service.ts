import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { BotRepository } from '../bot/bot.repository';
import { SessionRepository } from '../session/session.repository';
import { MessageRepository } from '../message/message.repository';
import { MemoryRepository } from '../memory/memory.repository';
import { OpenAIService } from '../openai/openai.service';
import { UserService } from '../user/user.service';
import { ApiCredentialsService } from '../api-credentials/api-credentials.service';
import { SystemConfigRepository } from '../system-config/system-config.repository';
import { MEMORY_CONFIG } from '../common/constants/api.constants';
import {
  SessionResponseDto,
  ChatHistoryResponseDto,
  SendMessageResponseDto,
} from '../common/dto/chat.dto';

@Injectable()
export class ChatService {
  constructor(
    private readonly botRepository: BotRepository,
    private readonly sessionRepository: SessionRepository,
    private readonly messageRepository: MessageRepository,
    private readonly memoryRepository: MemoryRepository,
    private readonly openaiService: OpenAIService,
    private readonly userService: UserService,
    private readonly apiCredentialsService: ApiCredentialsService,
    private readonly systemConfigRepository: SystemConfigRepository
  ) {}

  async getSessions(
    botId: number,
    userId: string
  ): Promise<SessionResponseDto[]> {
    // Load bot with config
    const bot = await this.botRepository.findByIdWithConfig(botId, userId);
    if (!bot) {
      throw new HttpException('Bot not found', HttpStatus.NOT_FOUND);
    }

    // Get all sessions for this bot and user
    const sessions = await this.sessionRepository.findAllByBotId(botId, userId);

    return sessions.map((session) => ({
      id: session.id,
      session_name: session.sessionName,
      createdAt: session.createdAt,
    }));
  }

  async createSession(
    botId: number,
    userId: string
  ): Promise<SessionResponseDto> {
    // User is automatically synced to DB by ClerkGuard

    // Load bot with config
    const bot = await this.botRepository.findByIdWithConfig(botId, userId);
    if (!bot) {
      throw new HttpException('Bot not found', HttpStatus.NOT_FOUND);
    }

    // Create new session
    const session = await this.sessionRepository.create(userId, botId);

    return {
      id: session.id,
      session_name: session.sessionName,
      createdAt: session.createdAt,
    };
  }

  async getChatHistory(
    botId: number,
    userId: string,
    sessionId?: number
  ): Promise<ChatHistoryResponseDto> {
    // Load bot with config
    const bot = await this.botRepository.findByIdWithConfig(botId, userId);
    if (!bot) {
      throw new HttpException('Bot not found', HttpStatus.NOT_FOUND);
    }

    // Get or create session
    let session;
    if (sessionId) {
      session = await this.sessionRepository.findByIdAndUserId(
        sessionId,
        userId
      );
      if (!session || session.botId !== botId) {
        throw new HttpException('Session not found', HttpStatus.NOT_FOUND);
      }
    } else {
      session = await this.sessionRepository.findLatestByBotId(botId, userId);
      if (!session) {
        session = await this.sessionRepository.create(userId, botId);
      }
    }

    // Load messages with raw data
    const messageRecords =
      await this.messageRepository.findAllBySessionIdWithRawData(session.id);

    const messages = messageRecords.map(
      (msg: {
        role: string;
        content: string;
        rawRequest?: unknown;
        rawResponse?: unknown;
      }) => ({
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content,
        rawRequest: msg.rawRequest,
        rawResponse: msg.rawResponse,
      })
    );

    return {
      bot: {
        id: bot.id,
        name: bot.name,
        description: bot.description,
      },
      session: {
        id: session.id,
        session_name: session.sessionName,
      },
      messages,
    };
  }

  async sendMessage(
    botId: number,
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

    // Load bot with config
    const bot = await this.botRepository.findByIdWithConfig(botId, userId);
    if (!bot) {
      throw new HttpException('Bot not found', HttpStatus.NOT_FOUND);
    }

    const botConfig = this.botRepository.mergeBotConfig(bot.configs);

    // Get or create session
    let session;
    if (sessionId) {
      session = await this.sessionRepository.findByIdAndUserId(
        sessionId,
        userId
      );
      if (!session || session.botId !== botId) {
        throw new HttpException('Session not found', HttpStatus.NOT_FOUND);
      }
    } else {
      session = await this.sessionRepository.findLatestByBotId(botId, userId);
      if (!session) {
        session = await this.sessionRepository.create(userId, botId);
      }
    }

    // Load existing messages
    const existingMessages =
      await this.messageRepository.findAllBySessionIdForOpenAI(session.id);

    // Retrieve relevant memories using vector similarity
    let relevantMemories: string[] = [];
    try {
      const queryVector = await this.openaiService.generateEmbedding(
        message,
        apiKey
      );
      const similar = await this.memoryRepository.findSimilarForBot(
        queryVector,
        botId,
        userId,
        MEMORY_CONFIG.MAX_SIMILAR_MEMORIES,
        MEMORY_CONFIG.SIMILARITY_THRESHOLD
      );
      if (similar.length > 0) {
        relevantMemories = similar.map((m: { chunk: string }) => m.chunk);
        console.log(
          `Found ${relevantMemories.length} relevant memories for bot ${botId}`
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
    if (botConfig.system_prompt) {
      const systemPrompt = String(botConfig.system_prompt);
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
        systemBehaviorRules = this.parseBehaviorRules(systemConfig.configValue);
      }
    } catch (error) {
      console.error('Error loading system behavior rules:', error);
      // Continue without system rules if loading fails
    }

    if (systemBehaviorRules.length > 0) {
      const systemBehaviorRulesText = systemBehaviorRules
        .filter((rule) => rule.trim().length > 0)
        .map((rule, index) => `${index + 1}. ${rule.trim()}`)
        .join('\n');

      if (systemBehaviorRulesText.length > 0) {
        const systemBehaviorRulesMessage = `System Behavior Rules (Required):\n${systemBehaviorRulesText}`;

        // Check if system behavior rules are already present
        if (
          !messagesForAPI.some(
            (m) => m.role === 'system' && m.content === systemBehaviorRulesMessage
          )
        ) {
          // Add system behavior rules after system prompt but before bot-specific rules
          const systemPromptIndex = messagesForAPI.findIndex(
            (m) =>
              m.role === 'system' &&
              m.content === String(botConfig.system_prompt || '')
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

    // Add bot-specific behavior rules (these are additional to system rules)
    if (botConfig.behavior_rules) {
      let behaviorRules: string[] = [];

      // Parse behavior_rules - can be stored as JSON string, object with "rules" array, or direct array
      try {
        const rulesValue = botConfig.behavior_rules;

        if (typeof rulesValue === 'string') {
          // Try to parse as JSON
          try {
            const parsed = JSON.parse(rulesValue);
            if (Array.isArray(parsed)) {
              behaviorRules = parsed.map((r) => String(r));
            } else if (
              typeof parsed === 'object' &&
              parsed.rules &&
              Array.isArray(parsed.rules)
            ) {
              behaviorRules = parsed.rules.map((r: unknown) => String(r));
            } else {
              behaviorRules = [String(parsed)];
            }
          } catch {
            // Not valid JSON, treat as single rule string
            behaviorRules = [rulesValue];
          }
        } else if (Array.isArray(rulesValue)) {
          behaviorRules = rulesValue.map((r: unknown) => String(r));
        } else if (typeof rulesValue === 'object' && rulesValue !== null) {
          const rulesObj = rulesValue as { rules?: unknown[] };
          if (rulesObj.rules && Array.isArray(rulesObj.rules)) {
            behaviorRules = rulesObj.rules.map((r: unknown) => String(r));
          } else {
            behaviorRules = [String(rulesValue)];
          }
        } else {
          behaviorRules = [String(rulesValue)];
        }
      } catch (error) {
        console.error('Error parsing behavior rules:', error);
        // Continue without behavior rules if parsing fails
      }

      // Format behavior rules as a system message
      if (behaviorRules.length > 0) {
        const behaviorRulesText = behaviorRules
          .filter((rule) => rule.trim().length > 0)
          .map((rule, index) => `${index + 1}. ${rule.trim()}`)
          .join('\n');

        if (behaviorRulesText.length > 0) {
          const behaviorRulesMessage = `Behavior Rules:\n${behaviorRulesText}`;

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
                m.content === String(botConfig.system_prompt || '')
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
      model: String(botConfig.model || 'gpt-4o-mini'),
      messages: messagesForAPI,
      temperature: Number(botConfig.temperature || 0.7),
      max_tokens: botConfig.max_tokens
        ? Number(botConfig.max_tokens)
        : undefined,
    };

    // Save user message to database with raw request
    await this.messageRepository.create(
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
    await this.messageRepository.create(
      session.id,
      'assistant',
      response,
      {
        model: botConfig.model,
        temperature: botConfig.temperature,
      },
      undefined,
      completion
    );

    // Save memory chunk periodically (every N messages, or on first message)
    const allMessages =
      await this.messageRepository.findAllBySessionIdForOpenAI(session.id);
    const shouldSaveMemory =
      allMessages.length === 1 || // Save on first message
      (allMessages.length > 0 &&
        allMessages.length % MEMORY_CONFIG.MEMORY_SAVE_INTERVAL === 0);

    if (shouldSaveMemory) {
      try {
        const chunk =
          this.openaiService.createMemoryChunkFromMessages(allMessages);
        if (chunk && chunk.trim().length > 0) {
          const embedding = await this.openaiService.generateEmbedding(
            chunk,
            apiKey
          );
          if (embedding && embedding.length > 0) {
            await this.memoryRepository.create(session.id, chunk, embedding);
            console.log(
              `Saved memory chunk for session ${session.id} (${allMessages.length} messages)`
            );
          } else {
            console.warn('Empty embedding generated, skipping memory save');
          }
        } else {
          console.warn('Empty chunk generated, skipping memory save');
        }
      } catch (error) {
        console.error('Error saving memory chunk:', error);
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
    };
  }

  async deleteSession(
    botId: number,
    sessionId: number,
    userId: string
  ): Promise<void> {
    // Verify the bot belongs to the user
    const bot = await this.botRepository.findByIdAndUserId(botId, userId);
    if (!bot) {
      throw new HttpException('Bot not found', HttpStatus.NOT_FOUND);
    }

    // Verify the session belongs to the bot and user
    const session = await this.sessionRepository.findByIdAndUserId(
      sessionId,
      userId
    );
    if (!session) {
      throw new HttpException('Session not found', HttpStatus.NOT_FOUND);
    }

    if (session.botId !== botId) {
      throw new HttpException(
        'Session does not belong to this bot',
        HttpStatus.BAD_REQUEST
      );
    }

    // Delete the session - Prisma will cascade delete all related data (messages, memory chunks)
    await this.sessionRepository.delete(sessionId, userId);
  }

  private parseBehaviorRules(behaviorRules: unknown): string[] {
    if (!behaviorRules) return [];

    try {
      if (typeof behaviorRules === 'string') {
        try {
          const parsed = JSON.parse(behaviorRules);
          if (Array.isArray(parsed)) {
            return parsed.map((r) => String(r));
          } else if (
            typeof parsed === 'object' &&
            parsed !== null &&
            'rules' in parsed &&
            Array.isArray((parsed as { rules: unknown }).rules)
          ) {
            return (parsed as { rules: unknown[] }).rules.map((r: unknown) => String(r));
          } else {
            return [String(parsed)];
          }
        } catch {
          return [behaviorRules];
        }
      } else if (Array.isArray(behaviorRules)) {
        return behaviorRules.map((r: unknown) => String(r));
      } else if (
        typeof behaviorRules === 'object' &&
        behaviorRules !== null &&
        'rules' in behaviorRules &&
        Array.isArray((behaviorRules as { rules: unknown }).rules)
      ) {
        const rulesObj = behaviorRules as { rules: unknown[] };
        return rulesObj.rules.map((r: unknown) => String(r));
      } else {
        return [String(behaviorRules)];
      }
    } catch (error) {
      console.error('Error parsing behavior rules:', error);
      return [];
    }
  }
}
