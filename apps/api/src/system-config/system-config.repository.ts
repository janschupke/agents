import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type {
  SystemConfig as PrismaSystemConfig,
  Prisma,
} from '@prisma/client';
import { SystemConfig } from '../common/types/config.types';

@Injectable()
export class SystemConfigRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByKey(configKey: string): Promise<PrismaSystemConfig | null> {
    return this.prisma.systemConfig.findUnique({
      where: { configKey },
    });
  }

  async findAll(): Promise<PrismaSystemConfig[]> {
    return this.prisma.systemConfig.findMany({
      orderBy: { configKey: 'asc' },
    });
  }

  async findAllAsRecord(): Promise<SystemConfig> {
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

  async updateConfigs(configs: SystemConfig): Promise<void> {
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
