import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import {
  loadBotWithConfig,
  mergeBotConfig,
} from '../bot.js';
import {
  createSession,
  loadLatestSession,
} from '../session.js';
import { saveMessage, loadMessagesForOpenAI } from '../message.js';
import {
  saveMemoryChunk,
  createMemoryChunkFromMessages,
  generateEmbedding,
  findSimilarMemoriesForBot,
} from '../memory.js';
import { createOpenAIClient } from '../clients.js';

@Injectable()
export class ChatService {
  async getChatHistory(botId: number) {
    // Load bot with config
    const bot = await loadBotWithConfig(botId);
    if (!bot) {
      throw new HttpException('Bot not found', HttpStatus.NOT_FOUND);
    }

    // Get or create session
    let session = await loadLatestSession(botId);
    if (!session) {
      session = await createSession(botId);
    }

    // Load messages
    const messages = await loadMessagesForOpenAI(session.id);

    return {
      bot: {
        id: bot.id,
        name: bot.name,
        description: bot.description,
      },
      session: {
        id: session.id,
        session_name: session.session_name,
      },
      messages,
    };
  }

  async sendMessage(botId: number, message: string) {
    // Load bot with config
    const bot = await loadBotWithConfig(botId);
    if (!bot) {
      throw new HttpException('Bot not found', HttpStatus.NOT_FOUND);
    }

    const botConfig = mergeBotConfig(bot.config);

    // Get or create session
    let session = await loadLatestSession(botId);
    if (!session) {
      session = await createSession(botId);
    }

    // Load existing messages
    const existingMessages = await loadMessagesForOpenAI(session.id);

    // Retrieve relevant memories using vector similarity
    let relevantMemories: string[] = [];
    try {
      const queryVector = await generateEmbedding(message);
      const similar = await findSimilarMemoriesForBot(
        queryVector,
        botId,
        3,
        0.7
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
    await saveMessage(session.id, 'user', message);

    // Call OpenAI API
    const openai = createOpenAIClient();
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
    await saveMessage(session.id, 'assistant', response, {
      model: botConfig.model,
      temperature: botConfig.temperature,
    });

    // Save memory chunk periodically (every 10 messages)
    const allMessages = await loadMessagesForOpenAI(session.id);
    if (allMessages.length > 0 && allMessages.length % 10 === 0) {
      try {
        const chunk = createMemoryChunkFromMessages(allMessages);
        await saveMemoryChunk(session.id, chunk);
      } catch (error) {
        // Ignore memory save errors
      }
    }

    return {
      response,
      session: {
        id: session.id,
        session_name: session.session_name,
      },
    };
  }
}
