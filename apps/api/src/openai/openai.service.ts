import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import OpenAI from 'openai';
import { config } from 'dotenv';
import { NUMERIC_CONSTANTS } from '../common/constants/numeric.constants.js';

config();

@Injectable()
export class OpenAIService {
  private readonly logger = new Logger(OpenAIService.name);
  private readonly defaultOpenai: OpenAI | null;

  constructor() {
    // Keep default client for backward compatibility (optional)
    const apiKey = process.env.OPENAI_API_KEY;
    this.defaultOpenai = apiKey ? new OpenAI({ apiKey }) : null;
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

      throw new InternalServerErrorException('No embedding returned from OpenAI');
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
   */
  async createChatCompletion(
    apiKey: string,
    options: {
      model: string;
      systemMessage: string;
      userMessage: string;
      temperature?: number;
      maxTokens?: number;
    }
  ): Promise<string> {
    try {
      const openai = this.getClient(apiKey);
      const completion = await openai.chat.completions.create({
        model: options.model,
        messages: [
          {
            role: 'system',
            content: options.systemMessage,
          },
          {
            role: 'user',
            content: options.userMessage,
          },
        ],
        temperature: options.temperature ?? NUMERIC_CONSTANTS.DEFAULT_TEMPERATURE,
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
