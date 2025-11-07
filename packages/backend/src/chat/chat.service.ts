import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { BotRepository } from '../../bot/repository/bot.repository.js';
import { SessionRepository } from '../../session/repository/session.repository.js';
import { MessageRepository } from '../../message/repository/message.repository.js';
import { MemoryRepository } from '../../memory/repository/memory.repository.js';
import { OpenAIService } from '../../openai/openai.service.js';
import { MEMORY_CONFIG } from '../../common/constants/api.constants.js';
import OpenAI from 'openai';

@Injectable()
export class ChatService {
  constructor(
    private readonly botRepository: BotRepository,
    private readonly sessionRepository: SessionRepository,
    private readonly messageRepository: MessageRepository,
    private readonly memoryRepository: MemoryRepository,
    private readonly openaiService: OpenAIService
  ) {}

  async getChatHistory(botId: number) {
    // Load bot with config
    const bot = await this.botRepository.findByIdWithConfig(botId);
    if (!bot) {
      throw new HttpException('Bot not found', HttpStatus.NOT_FOUND);
    }

    // Get or create session
    let session = await this.sessionRepository.findLatestByBotId(botId);
    if (!session) {
      session = await this.sessionRepository.create(botId);
    }

    // Load messages
    const messages = await this.messageRepository.findAllBySessionIdForOpenAI(
      session.id
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

  async sendMessage(botId: number, message: string) {
    // Load bot with config
    const bot = await this.botRepository.findByIdWithConfig(botId);
    if (!bot) {
      throw new HttpException('Bot not found', HttpStatus.NOT_FOUND);
    }

    const botConfig = this.botRepository.mergeBotConfig(bot.config);

    // Get or create session
    let session = await this.sessionRepository.findLatestByBotId(botId);
    if (!session) {
      session = await this.sessionRepository.create(botId);
    }

    // Load existing messages
    const existingMessages =
      await this.messageRepository.findAllBySessionIdForOpenAI(session.id);

    // Retrieve relevant memories using vector similarity
    let relevantMemories: string[] = [];
    try {
      const queryVector = await this.openaiService.generateEmbedding(message);
      const similar = await this.memoryRepository.findSimilarForBot(
        queryVector,
        botId,
        MEMORY_CONFIG.MAX_SIMILAR_MEMORIES,
        MEMORY_CONFIG.SIMILARITY_THRESHOLD
      );
      if (similar.length > 0) {
        relevantMemories = similar.map((m) => m.chunk);
      }
    } catch (error) {
      // Ignore memory errors
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

    // Save user message to database
    await this.messageRepository.create(session.id, 'user', message);

    // Call OpenAI API
    const openai = this.openaiService.getClient();
    const completion = await openai.chat.completions.create({
      model: String(botConfig.model || 'gpt-4o-mini'),
      messages: messagesForAPI,
      temperature: Number(botConfig.temperature || 0.7),
      max_tokens: botConfig.max_tokens
        ? Number(botConfig.max_tokens)
        : undefined,
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new HttpException(
        'No response from OpenAI',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    // Save assistant message to database
    await this.messageRepository.create(session.id, 'assistant', response, {
      model: botConfig.model,
      temperature: botConfig.temperature,
    });

    // Save memory chunk periodically
    const allMessages =
      await this.messageRepository.findAllBySessionIdForOpenAI(session.id);
    if (allMessages.length > 0 && allMessages.length % MEMORY_CONFIG.MEMORY_SAVE_INTERVAL === 0) {
      try {
        const chunk = this.openaiService.createMemoryChunkFromMessages(
          allMessages
        );
        const embedding = await this.openaiService.generateEmbedding(chunk);
        await this.memoryRepository.create(session.id, chunk, embedding);
      } catch (error) {
        // Ignore memory save errors
      }
    }

    return {
      response,
      session: {
        id: session.id,
        session_name: session.sessionName,
      },
    };
  }
}
