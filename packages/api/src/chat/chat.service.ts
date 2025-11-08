import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { BotRepository } from '../bot/repository/bot.repository';
import { SessionRepository } from '../session/repository/session.repository';
import { MessageRepository } from '../message/repository/message.repository';
import { MemoryRepository } from '../memory/repository/memory.repository';
import { OpenAIService } from '../openai/openai.service';
import { UserService } from '../user/user.service';
import { ApiCredentialsService } from '../api-credentials/api-credentials.service';
import { MEMORY_CONFIG } from '../common/constants/api.constants';
import OpenAI from 'openai';

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
  ) {}

  async getSessions(botId: number, userId: string) {
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

  async createSession(botId: number, userId: string) {
    // User will be created automatically by controller's ensureUser method

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

  async getChatHistory(botId: number, userId: string, sessionId?: number) {
    // Load bot with config
    const bot = await this.botRepository.findByIdWithConfig(botId, userId);
    if (!bot) {
      throw new HttpException('Bot not found', HttpStatus.NOT_FOUND);
    }

    // Get or create session
    let session;
    if (sessionId) {
      session = await this.sessionRepository.findByIdAndUserId(sessionId, userId);
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
    const messageRecords = await this.messageRepository.findAllBySessionIdWithRawData(
      session.id
    );

    const messages = messageRecords.map((msg) => ({
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content,
      rawRequest: msg.rawRequest,
      rawResponse: msg.rawResponse,
    }));

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
    sessionId?: number,
  ) {
    // User will be created automatically by controller's ensureUser method

    // Check if user has API key
    const apiKey = await this.apiCredentialsService.getApiKey(userId, 'openai');
    if (!apiKey) {
      throw new HttpException(
        'OpenAI API key is required. Please set your API key in your profile.',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Load bot with config
    const bot = await this.botRepository.findByIdWithConfig(botId, userId);
    if (!bot) {
      throw new HttpException('Bot not found', HttpStatus.NOT_FOUND);
    }

    const botConfig = this.botRepository.mergeBotConfig(bot.config);

    // Get or create session
    let session;
    if (sessionId) {
      session = await this.sessionRepository.findByIdAndUserId(sessionId, userId);
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
      const queryVector = await this.openaiService.generateEmbedding(message, apiKey);
      const similar = await this.memoryRepository.findSimilarForBot(
        queryVector,
        botId,
        userId,
        MEMORY_CONFIG.MAX_SIMILAR_MEMORIES,
        MEMORY_CONFIG.SIMILARITY_THRESHOLD
      );
      if (similar.length > 0) {
        relevantMemories = similar.map((m: { chunk: string }) => m.chunk);
        console.log(`Found ${relevantMemories.length} relevant memories for bot ${botId}`);
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
        HttpStatus.INTERNAL_SERVER_ERROR,
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
      (allMessages.length > 0 && allMessages.length % MEMORY_CONFIG.MEMORY_SAVE_INTERVAL === 0);
    
    if (shouldSaveMemory) {
      try {
        const chunk = this.openaiService.createMemoryChunkFromMessages(
          allMessages
        );
        if (chunk && chunk.trim().length > 0) {
          const embedding = await this.openaiService.generateEmbedding(chunk, apiKey);
          if (embedding && embedding.length > 0) {
            await this.memoryRepository.create(session.id, chunk, embedding);
            console.log(`Saved memory chunk for session ${session.id} (${allMessages.length} messages)`);
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
}
