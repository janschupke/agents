import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { Bot } from '@prisma/client';
import { BotWithConfig } from '../../common/interfaces/bot.interface';
import { DEFAULT_BOT_CONFIG } from '../../common/constants/api.constants';

@Injectable()
export class BotRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: number): Promise<Bot | null> {
    return this.prisma.bot.findUnique({
      where: { id },
    });
  }

  async findByIdAndUserId(id: number, userId: string): Promise<Bot | null> {
    return this.prisma.bot.findFirst({
      where: { id, userId },
    });
  }

  async findByName(name: string, userId: string): Promise<Bot | null> {
    return this.prisma.bot.findFirst({
      where: { name, userId },
    });
  }

  async findConfigsByBotId(botId: number): Promise<Record<string, unknown>> {
    const configs = await this.prisma.botConfig.findMany({
      where: { botId },
    });

    const config: Record<string, unknown> = {};
    for (const item of configs) {
      config[item.configKey] = item.configValue;
    }

    return config;
  }

  async findByIdWithConfig(
    id: number,
    userId: string,
  ): Promise<BotWithConfig | null> {
    const bot = await this.findByIdAndUserId(id, userId);
    if (!bot) {
      return null;
    }

    const config = await this.findConfigsByBotId(id);

    return {
      ...bot,
      config,
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
}
