import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { BotRepository } from './repository/bot.repository';
import { MemoryRepository } from '../memory/repository/memory.repository';

@Injectable()
export class BotService {
  constructor(
    private readonly botRepository: BotRepository,
    private readonly memoryRepository: MemoryRepository,
  ) {}

  async findAll() {
    return this.botRepository.findAll();
  }

  async findById(id: number) {
    const bot = await this.botRepository.findByIdWithConfig(id);
    if (!bot) {
      throw new HttpException('Bot not found', HttpStatus.NOT_FOUND);
    }
    return bot;
  }

  async create(name: string, description?: string) {
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      throw new HttpException(
        'Bot name is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    const existingBot = await this.botRepository.findByName(name);
    if (existingBot) {
      throw new HttpException(
        'Bot with this name already exists',
        HttpStatus.CONFLICT,
      );
    }

    return this.botRepository.create(name, description);
  }

  async update(id: number, name: string, description?: string) {
    const bot = await this.botRepository.findById(id);
    if (!bot) {
      throw new HttpException('Bot not found', HttpStatus.NOT_FOUND);
    }

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      throw new HttpException(
        'Bot name is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Check if name is being changed and if it conflicts with another bot
    if (name !== bot.name) {
      const existingBot = await this.botRepository.findByName(name);
      if (existingBot && existingBot.id !== id) {
        throw new HttpException(
          'Bot with this name already exists',
          HttpStatus.CONFLICT,
        );
      }
    }

    return this.botRepository.update(id, name, description);
  }

  async getEmbeddings(botId: number) {
    const bot = await this.botRepository.findById(botId);
    if (!bot) {
      throw new HttpException('Bot not found', HttpStatus.NOT_FOUND);
    }

    const embeddings = await this.memoryRepository.findAllByBotId(botId);
    return embeddings.map((embedding) => ({
      id: embedding.id,
      sessionId: embedding.sessionId,
      chunk: embedding.chunk,
      createdAt: embedding.createdAt,
    }));
  }

  async deleteEmbedding(botId: number, embeddingId: number) {
    const bot = await this.botRepository.findById(botId);
    if (!bot) {
      throw new HttpException('Bot not found', HttpStatus.NOT_FOUND);
    }

    // Verify the embedding belongs to a session of this bot
    const embeddings = await this.memoryRepository.findAllByBotId(botId);
    const embedding = embeddings.find((e) => e.id === embeddingId);

    if (!embedding) {
      throw new HttpException(
        'Embedding not found or does not belong to this bot',
        HttpStatus.NOT_FOUND,
      );
    }

    await this.memoryRepository.deleteById(embeddingId);
  }
}
