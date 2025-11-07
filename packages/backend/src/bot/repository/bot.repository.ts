import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { Bot, BotConfig, Prisma } from '@prisma/client';

export interface BotWithConfig extends Bot {
  config: Record<string, unknown>;
}

@Injectable()
export class BotRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: number): Promise<Bot | null> {
    return this.prisma.bot.findUnique({
      where: { id },
    });
  }

  async findByName(name: string): Promise<Bot | null> {
    return this.prisma.bot.findFirst({
      where: { name },
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

  async findByIdWithConfig(id: number): Promise<BotWithConfig | null> {
    const bot = await this.findById(id);
    if (!bot) {
      return null;
    }

    const config = await this.findConfigsByBotId(id);

    return {
      ...bot,
      config,
    };
  }

  async findByNameWithConfig(name: string): Promise<BotWithConfig | null> {
    const bot = await this.findByName(name);
    if (!bot) {
      return null;
    }

    const config = await this.findConfigsByBotId(bot.id);

    return {
      ...bot,
      config,
    };
  }

  getDefaultBotConfig(): Record<string, unknown> {
    return {
      model: 'gpt-4o-mini',
      temperature: 0.7,
      max_tokens: 1000,
      system_prompt: 'You are a helpful assistant.',
    };
  }

  mergeBotConfig(botConfig: Record<string, unknown>): Record<string, unknown> {
    const defaults = this.getDefaultBotConfig();
    return { ...defaults, ...botConfig };
  }
}
