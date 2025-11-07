import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { config } from 'dotenv';

config();

@Injectable()
export class OpenAIService {
  private readonly openai: OpenAI;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not set in .env file');
    }
    this.openai = new OpenAI({ apiKey });
  }

  getClient(): OpenAI {
    return this.openai;
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
      });

      if (response.data && response.data.length > 0) {
        return response.data[0].embedding;
      }

      throw new Error('No embedding returned from OpenAI');
    } catch (error) {
      const err = error as { message?: string };
      throw new Error(
        `Failed to generate embedding: ${err.message || 'Unknown error'}`
      );
    }
  }

  createMemoryChunkFromMessages(
    messages: Array<{ role: string; content: string }>
  ): string {
    // Simple implementation: combine recent messages into a summary
    const recentMessages = messages.slice(-5); // Last 5 messages
    return recentMessages
      .map((msg) => `${msg.role}: ${msg.content}`)
      .join('\n');
  }
}
