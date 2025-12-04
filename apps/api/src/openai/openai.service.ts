import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { NUMERIC_CONSTANTS } from '../common/constants/numeric.constants.js';
import { MessageRole } from '../common/enums/message-role.enum';

@Injectable()
export class OpenAIService {
  private readonly logger = new Logger(OpenAIService.name);
  private readonly defaultOpenai: OpenAI | null;

  constructor(private readonly configService: ConfigService) {
    // Keep default client for backward compatibility (optional)
    const apiKey = this.configService.get<string>('app.openai.apiKey') || '';
    this.defaultOpenai = apiKey ? new OpenAI({ apiKey }) : null;
    if (!apiKey) {
      this.logger.debug('No default OpenAI API key configured');
    }
  }

  /**
   * Get OpenAI client with a specific API key
   */
  getClient(apiKey?: string): OpenAI {
    if (apiKey) {
      return new OpenAI({ apiKey });
    }
    if (this.defaultOpenai) {
      return this.defaultOpenai;
    }
    throw new BadRequestException(
      'No API key provided and OPENAI_API_KEY is not set in .env file'
    );
  }

  async generateEmbedding(text: string, apiKey?: string): Promise<number[]> {
    try {
      const openai = this.getClient(apiKey);
      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
        dimensions: NUMERIC_CONSTANTS.EMBEDDING_DIMENSIONS,
      });

      if (response.data && response.data.length > 0) {
        const embedding = response.data[0].embedding;
        if (embedding.length !== NUMERIC_CONSTANTS.EMBEDDING_DIMENSIONS) {
          this.logger.warn(
            `Warning: Expected embedding dimension ${NUMERIC_CONSTANTS.EMBEDDING_DIMENSIONS}, got ${embedding.length}`
          );
        }
        return embedding;
      }

      throw new InternalServerErrorException(
        'No embedding returned from OpenAI'
      );
    } catch (error) {
      const err = error as { message?: string };
      this.logger.error(
        'Error generating embedding:',
        err.message || 'Unknown error'
      );
      throw new InternalServerErrorException(
        `Failed to generate embedding: ${err.message || 'Unknown error'}`
      );
    }
  }

  createMemoryChunkFromMessages(
    messages: Array<{ role: string; content: string }>
  ): string {
    // Simple implementation: combine recent messages into a summary
    const recentMessages = messages.slice(
      -NUMERIC_CONSTANTS.MEMORY_EXTRACTION_MESSAGES
    );
    return recentMessages
      .map((msg) => `${msg.role}: ${msg.content}`)
      .join('\n');
  }

  /**
   * Helper method for common OpenAI chat completion pattern
   * Centralizes the pattern used across multiple services
   *
   * This method automatically limits conversation history to the last 6 messages
   * (3 user messages and 3 assistant responses) to provide context while managing
   * token usage. Only user and assistant messages from the history are included;
   * system messages are excluded from the history limit.
   *
   * @param apiKey - OpenAI API key
   * @param options - Chat completion options
   * @param options.model - Model to use
   * @param options.systemMessage - System message/prompt (always included)
   * @param options.userMessage - Current user message (always included)
   * @param options.conversationHistory - Optional array of previous messages (role, content).
   *                                      Only the last 6 messages (3 user + 3 assistant) will be used as context.
   * @param options.temperature - Optional temperature setting
   * @param options.maxTokens - Optional max tokens setting
   */
  async createChatCompletion(
    apiKey: string,
    options: {
      model: string;
      systemMessage: string;
      userMessage: string;
      conversationHistory?: Array<{ role: string; content: string }>;
      temperature?: number;
      maxTokens?: number;
    }
  ): Promise<string> {
    try {
      const openai = this.getClient(apiKey);

      // Build messages array with system message, limited conversation history, and current user message
      const messages: Array<{
        role: 'system' | 'user' | 'assistant';
        content: string;
      }> = [
        {
          role: 'system',
          content: options.systemMessage,
        },
      ];

      // Filter and limit conversation history to last 6 messages (3 user + 3 assistant)
      // Only include user and assistant messages, exclude system messages from history
      if (
        options.conversationHistory &&
        options.conversationHistory.length > 0
      ) {
        // Filter to only user and assistant messages, preserving order
        // Convert MessageRole enum to OpenAI API format (lowercase strings)
        const userAndAssistantMessages = options.conversationHistory
          .filter(
            (msg) =>
              msg.role === MessageRole.USER ||
              msg.role === MessageRole.ASSISTANT
          )
          .map((msg) => ({
            role: msg.role.toLowerCase() as 'user' | 'assistant',
            content: msg.content,
          }));

        // Take only the last 6 messages (3 user-assistant pairs)
        const limitedHistory = userAndAssistantMessages.slice(-6);

        if (limitedHistory.length > 0) {
          messages.push(...limitedHistory);
        }
      }

      // Add current user message
      messages.push({
        role: 'user',
        content: options.userMessage,
      });

      const completion = await openai.chat.completions.create({
        model: options.model,
        messages: messages as Parameters<
          typeof openai.chat.completions.create
        >[0]['messages'],
        temperature:
          options.temperature ?? NUMERIC_CONSTANTS.DEFAULT_TEMPERATURE,
        max_tokens: options.maxTokens,
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new InternalServerErrorException('No response from OpenAI');
      }

      return response;
    } catch (error) {
      const err = error as { message?: string };
      this.logger.error(
        'Error creating chat completion:',
        err.message || 'Unknown error'
      );
      throw new InternalServerErrorException(
        `Failed to create chat completion: ${err.message || 'Unknown error'}`
      );
    }
  }
}
