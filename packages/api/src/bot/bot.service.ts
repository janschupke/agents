import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { BotRepository } from './bot.repository';
import { MemoryRepository } from '../memory/memory.repository';
import { UserService } from '../user/user.service';
import {
  BotResponse,
  EmbeddingResponse,
} from '../common/interfaces/bot.interface';

@Injectable()
export class BotService {
  constructor(
    private readonly botRepository: BotRepository,
    private readonly memoryRepository: MemoryRepository,
    private readonly userService: UserService
  ) {}

  async findAll(userId: string): Promise<BotResponse[]> {
    return this.botRepository.findAll(userId);
  }

  async findById(id: number, userId: string): Promise<BotResponse> {
    const bot = await this.botRepository.findByIdWithConfig(id, userId);
    if (!bot) {
      throw new HttpException('Bot not found', HttpStatus.NOT_FOUND);
    }
    // Convert BotWithConfig to BotResponse
    const botResponse = await this.botRepository.findById(id);
    if (!botResponse) {
      throw new HttpException('Bot not found', HttpStatus.NOT_FOUND);
    }
    return {
      ...botResponse,
      configs: bot.configs,
    };
  }

  async create(
    userId: string,
    name: string,
    description?: string,
    configs?: Record<string, unknown>
  ): Promise<BotResponse> {
    // User is automatically synced to DB by ClerkGuard

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      throw new HttpException('Bot name is required', HttpStatus.BAD_REQUEST);
    }

    const existingBot = await this.botRepository.findByName(name, userId);
    if (existingBot) {
      throw new HttpException(
        'Bot with this name already exists',
        HttpStatus.CONFLICT
      );
    }

    const bot = await this.botRepository.create(userId, name, description);

    // Set configs if provided
    if (configs) {
      await this.botRepository.updateConfigs(bot.id, configs);
    }

    return bot;
  }

  async update(
    id: number,
    userId: string,
    name: string,
    description?: string,
    configs?: Record<string, unknown>
  ): Promise<BotResponse> {
    const bot = await this.botRepository.findByIdAndUserId(id, userId);
    if (!bot) {
      throw new HttpException('Bot not found', HttpStatus.NOT_FOUND);
    }

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      throw new HttpException('Bot name is required', HttpStatus.BAD_REQUEST);
    }

    // Check if name is being changed and if it conflicts with another bot
    if (name !== bot.name) {
      const existingBot = await this.botRepository.findByName(name, userId);
      if (existingBot && existingBot.id !== id) {
        throw new HttpException(
          'Bot with this name already exists',
          HttpStatus.CONFLICT
        );
      }
    }

    const updated = await this.botRepository.update(
      id,
      userId,
      name,
      description
    );
    if (!updated) {
      throw new HttpException('Bot not found', HttpStatus.NOT_FOUND);
    }

    // Update configs if provided
    if (configs) {
      await this.botRepository.updateConfigs(id, configs);
    }

    return updated;
  }

  async getEmbeddings(
    botId: number,
    userId: string
  ): Promise<EmbeddingResponse[]> {
    const bot = await this.botRepository.findByIdAndUserId(botId, userId);
    if (!bot) {
      throw new HttpException('Bot not found', HttpStatus.NOT_FOUND);
    }

    const embeddings = await this.memoryRepository.findAllByBotIdAndUserId(
      botId,
      userId
    );
    return embeddings.map(
      (embedding: {
        id: number;
        sessionId: number;
        chunk: string;
        createdAt: Date;
      }) => ({
        id: embedding.id,
        sessionId: embedding.sessionId,
        chunk: embedding.chunk,
        createdAt: embedding.createdAt,
      })
    );
  }

  async deleteEmbedding(
    botId: number,
    embeddingId: number,
    userId: string
  ): Promise<void> {
    const bot = await this.botRepository.findByIdAndUserId(botId, userId);
    if (!bot) {
      throw new HttpException('Bot not found', HttpStatus.NOT_FOUND);
    }

    // Verify the embedding belongs to a session of this bot and user
    const embeddings = await this.memoryRepository.findAllByBotIdAndUserId(
      botId,
      userId
    );
    const embedding = embeddings.find(
      (e: { id: number }) => e.id === embeddingId
    );

    if (!embedding) {
      throw new HttpException(
        'Embedding not found or does not belong to this bot',
        HttpStatus.NOT_FOUND
      );
    }

    await this.memoryRepository.deleteById(embeddingId);
  }

  async delete(id: number, userId: string): Promise<void> {
    const bot = await this.botRepository.findByIdAndUserId(id, userId);
    if (!bot) {
      throw new HttpException('Bot not found', HttpStatus.NOT_FOUND);
    }

    // Delete the bot - Prisma will cascade delete all related data (sessions, messages, configs, embeddings)
    await this.botRepository.delete(id, userId);
  }
}
