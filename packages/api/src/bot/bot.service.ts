import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { BotRepository } from './repository/bot.repository';
import { MemoryRepository } from '../memory/repository/memory.repository';
import { UserService } from '../user/user.service';

@Injectable()
export class BotService {
  constructor(
    private readonly botRepository: BotRepository,
    private readonly memoryRepository: MemoryRepository,
    private readonly userService: UserService,
  ) {}

  async findAll(userId: string) {
    return this.botRepository.findAll(userId);
  }

  async findById(id: number, userId: string) {
    const bot = await this.botRepository.findByIdWithConfig(id, userId);
    if (!bot) {
      throw new HttpException('Bot not found', HttpStatus.NOT_FOUND);
    }
    return bot;
  }

  async create(userId: string, name: string, description?: string) {
    // User will be created automatically by controller's ensureUser method

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      throw new HttpException(
        'Bot name is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    const existingBot = await this.botRepository.findByName(name, userId);
    if (existingBot) {
      throw new HttpException(
        'Bot with this name already exists',
        HttpStatus.CONFLICT,
      );
    }

    return this.botRepository.create(userId, name, description);
  }

  async update(id: number, userId: string, name: string, description?: string) {
    const bot = await this.botRepository.findByIdAndUserId(id, userId);
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
      const existingBot = await this.botRepository.findByName(name, userId);
      if (existingBot && existingBot.id !== id) {
        throw new HttpException(
          'Bot with this name already exists',
          HttpStatus.CONFLICT,
        );
      }
    }

    const updated = await this.botRepository.update(id, userId, name, description);
    if (!updated) {
      throw new HttpException('Bot not found', HttpStatus.NOT_FOUND);
    }
    return updated;
  }

  async getEmbeddings(botId: number, userId: string) {
    const bot = await this.botRepository.findByIdAndUserId(botId, userId);
    if (!bot) {
      throw new HttpException('Bot not found', HttpStatus.NOT_FOUND);
    }

    const embeddings = await this.memoryRepository.findAllByBotIdAndUserId(botId, userId);
    return embeddings.map((embedding) => ({
      id: embedding.id,
      sessionId: embedding.sessionId,
      chunk: embedding.chunk,
      createdAt: embedding.createdAt,
    }));
  }

  async deleteEmbedding(botId: number, embeddingId: number, userId: string) {
    const bot = await this.botRepository.findByIdAndUserId(botId, userId);
    if (!bot) {
      throw new HttpException('Bot not found', HttpStatus.NOT_FOUND);
    }

    // Verify the embedding belongs to a session of this bot and user
    const embeddings = await this.memoryRepository.findAllByBotIdAndUserId(botId, userId);
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
