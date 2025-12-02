import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { config } from 'dotenv';
import { NUMERIC_CONSTANTS } from '../common/constants/numeric.constants.js';

config();

@Injectable()
export class OpenAIService {
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
    throw new Error(
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
          console.warn(
            `Warning: Expected embedding dimension ${NUMERIC_CONSTANTS.EMBEDDING_DIMENSIONS}, got ${embedding.length}`
          );
        }
        return embedding;
      }

      throw new Error('No embedding returned from OpenAI');
    } catch (error) {
      const err = error as { message?: string };
      console.error(
        'Error generating embedding:',
        err.message || 'Unknown error'
      );
      throw new Error(
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
}
