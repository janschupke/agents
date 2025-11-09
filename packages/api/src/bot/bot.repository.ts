import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { Bot } from '@prisma/client';
import { BotWithConfig } from '../common/interfaces/bot.interface';
import { DEFAULT_BOT_CONFIG } from '../common/constants/api.constants';

@Injectable()
export class BotRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: number): Promise<Bot | null> {
    return this.prisma.bot.findUnique({
      where: { id },
    });
  }

  async findByIdAndUserId(id: number, userId: string): Promise<Bot | null> {
    const perfStart = Date.now();
    // Use findUnique with compound where for better index usage
    // This is more efficient than findFirst when we have a unique constraint
    const result = await this.prisma.bot.findFirst({
      where: { id, userId },
      // Select only needed fields to reduce data transfer
      select: {
        id: true,
        userId: true,
        name: true,
        description: true,
        createdAt: true,
      },
    });
    const perfTime = Date.now() - perfStart;
    if (perfTime > 50) {
      console.log(`[Performance] BotRepository.findByIdAndUserId took ${perfTime}ms for bot ${id}`);
    }
    return result;
  }

  async findByName(name: string, userId: string): Promise<Bot | null> {
    return this.prisma.bot.findFirst({
      where: { name, userId },
    });
  }

  async findConfigsByBotId(botId: number): Promise<Record<string, unknown>> {
    const perfStart = Date.now();
    // Select only needed fields to reduce data transfer
    const configs = await this.prisma.botConfig.findMany({
      where: { botId },
      select: {
        configKey: true,
        configValue: true,
      },
    });
    const queryTime = Date.now() - perfStart;
    if (queryTime > 50) {
      console.log(`[Performance] BotRepository.findConfigsByBotId query took ${queryTime}ms for bot ${botId}`);
    }

    const mapStart = Date.now();
    // Use reduce for better performance than for loop
    const config: Record<string, unknown> = configs.reduce((acc, item) => {
      acc[item.configKey] = item.configValue;
      return acc;
    }, {} as Record<string, unknown>);
    const mapTime = Date.now() - mapStart;
    if (mapTime > 10) {
      console.log(`[Performance] BotRepository.findConfigsByBotId mapping took ${mapTime}ms`);
    }

    return config;
  }

  async findByIdWithConfig(
    id: number,
    userId: string,
  ): Promise<BotWithConfig | null> {
    const perfStart = Date.now();
    // Load bot and configs in parallel to reduce total time
    const [bot, config] = await Promise.all([
      this.findByIdAndUserId(id, userId),
      this.findConfigsByBotId(id),
    ]);
    
    const totalTime = Date.now() - perfStart;
    if (totalTime > 100) {
      console.log(`[Performance] BotRepository.findByIdWithConfig COMPLETE (parallel) - total: ${totalTime}ms`);
    }
    
    if (!bot) {
      return null;
    }

    return {
      ...bot,
      configs: config,
    };
  }

  getDefaultBotConfig(): Record<string, unknown> {
    return { ...DEFAULT_BOT_CONFIG };
  }

  mergeBotConfig(botConfig: Record<string, unknown>): Record<string, unknown> {
    const defaults = this.getDefaultBotConfig();
    return { ...defaults, ...botConfig };
  }

  async findAll(userId: string): Promise<Bot[]> {
    return this.prisma.bot.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(
    userId: string,
    name: string,
    description?: string,
  ): Promise<Bot> {
    return this.prisma.bot.create({
      data: {
        userId,
        name,
        description: description || null,
      },
    });
  }

  async update(
    id: number,
    userId: string,
    name: string,
    description?: string,
  ): Promise<Bot> {
    // First verify the bot belongs to the user
    const bot = await this.findByIdAndUserId(id, userId);
    if (!bot) {
      return null as any; // Will be handled by service
    }

    return this.prisma.bot.update({
      where: { id },
      data: {
        name,
        description: description || null,
      },
    });
  }

  async upsertConfig(
    botId: number,
    configKey: string,
    configValue: unknown,
  ): Promise<void> {
    // Skip if value is undefined or null
    if (configValue === undefined || configValue === null) {
      return;
    }

    await this.prisma.botConfig.upsert({
      where: {
        botId_configKey: {
          botId,
          configKey,
        },
      },
      update: {
        configValue: configValue as any,
      },
      create: {
        botId,
        configKey,
        configValue: configValue as any,
      },
    });
  }

  async updateConfigs(
    botId: number,
    configs: Record<string, unknown>,
  ): Promise<void> {
    // Upsert each config key, skipping undefined/null values
    for (const [key, value] of Object.entries(configs)) {
      if (value !== undefined && value !== null) {
        await this.upsertConfig(botId, key, value);
      }
    }
  }

  async delete(id: number, userId: string): Promise<void> {
    // Verify the bot belongs to the user before deleting
    const bot = await this.findByIdAndUserId(id, userId);
    if (!bot) {
      return; // Will be handled by service
    }

    // Delete the bot - Prisma will cascade delete all related data (sessions, messages, configs)
    await this.prisma.bot.delete({
      where: { id },
    });
  }
}
