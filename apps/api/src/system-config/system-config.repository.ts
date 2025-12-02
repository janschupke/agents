import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { SystemConfig, Prisma } from '@prisma/client';

@Injectable()
export class SystemConfigRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByKey(configKey: string): Promise<SystemConfig | null> {
    return this.prisma.systemConfig.findUnique({
      where: { configKey },
    });
  }

  async findAll(): Promise<SystemConfig[]> {
    return this.prisma.systemConfig.findMany({
      orderBy: { configKey: 'asc' },
    });
  }

  async findAllAsRecord(): Promise<Record<string, unknown>> {
    const configs = await this.prisma.systemConfig.findMany({
      select: {
        configKey: true,
        configValue: true,
      },
    });

    return configs.reduce(
      (acc, item) => {
        acc[item.configKey] = item.configValue;
        return acc;
      },
      {} as Record<string, unknown>
    );
  }

  async upsert(configKey: string, configValue: unknown): Promise<SystemConfig> {
    return this.prisma.systemConfig.upsert({
      where: { configKey },
      update: {
        configValue: configValue as Prisma.InputJsonValue,
      },
      create: {
        configKey,
        configValue: configValue as Prisma.InputJsonValue,
      },
    });
  }

  async updateConfigs(configs: Record<string, unknown>): Promise<void> {
    for (const [key, value] of Object.entries(configs)) {
      if (value !== undefined && value !== null) {
        await this.upsert(key, value);
      }
    }
  }

  async delete(configKey: string): Promise<void> {
    await this.prisma.systemConfig.delete({
      where: { configKey },
    });
  }
}
