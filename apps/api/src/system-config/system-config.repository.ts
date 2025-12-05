import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type {
  SystemConfig as PrismaSystemConfig,
  Prisma,
  AgentType,
} from '@prisma/client';
import { SystemConfig } from '../common/types/config.types';

@Injectable()
export class SystemConfigRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByKey(configKey: string): Promise<PrismaSystemConfig | null> {
    return this.prisma.systemConfig.findFirst({
      where: { configKey, agentType: null },
    });
  }

  async findByKeyAndAgentType(
    configKey: string,
    agentType: AgentType | null
  ): Promise<PrismaSystemConfig | null> {
    return this.prisma.systemConfig.findUnique({
      where: {
        configKey_agentType: {
          configKey,
          agentType,
        },
      },
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

  async upsert(
    configKey: string,
    configValue: unknown,
    agentType: AgentType | null = null
  ): Promise<PrismaSystemConfig> {
    return this.prisma.systemConfig.upsert({
      where: {
        configKey_agentType: {
          configKey,
          agentType,
        },
      },
      update: {
        configValue: configValue as Prisma.InputJsonValue,
      },
      create: {
        configKey,
        configValue: configValue as Prisma.InputJsonValue,
        agentType,
      },
    });
  }

  /**
   * Get system prompt by agent type
   * Falls back to main prompt (agentType = null) if type-specific not found
   */
  async getSystemPromptByAgentType(
    agentType: AgentType | null
  ): Promise<string | null> {
    // Try to get type-specific prompt first
    if (agentType !== null) {
      const typeSpecific = await this.findByKeyAndAgentType(
        'system_prompt',
        agentType
      );
      if (typeSpecific && typeSpecific.configValue) {
        const prompt =
          typeof typeSpecific.configValue === 'string'
            ? typeSpecific.configValue
            : String(typeSpecific.configValue || '');
        if (prompt.trim().length > 0) {
          return prompt;
        }
      }
    }

    // Fall back to main prompt
    const main = await this.findByKeyAndAgentType('system_prompt', null);
    if (main && main.configValue) {
      const prompt =
        typeof main.configValue === 'string'
          ? main.configValue
          : String(main.configValue || '');
      return prompt.trim().length > 0 ? prompt : null;
    }

    return null;
  }

  /**
   * Get system behavior rules by agent type
   * Falls back to main rules (agentType = null) if type-specific not found
   */
  async getBehaviorRulesByAgentType(
    agentType: AgentType | null
  ): Promise<string[]> {
    // Try to get type-specific rules first
    if (agentType !== null) {
      const typeSpecific = await this.findByKeyAndAgentType(
        'behavior_rules',
        agentType
      );
      if (typeSpecific && typeSpecific.configValue) {
        const rules = this.parseBehaviorRules(typeSpecific.configValue);
        if (rules.length > 0) {
          return rules;
        }
      }
    }

    // Fall back to main rules
    const main = await this.findByKeyAndAgentType('behavior_rules', null);
    if (main && main.configValue) {
      return this.parseBehaviorRules(main.configValue);
    }

    return [];
  }

  private parseBehaviorRules(configValue: unknown): string[] {
    if (Array.isArray(configValue)) {
      return configValue
        .filter((item): item is string => typeof item === 'string')
        .filter((item) => item.trim().length > 0);
    }
    if (
      typeof configValue === 'object' &&
      configValue !== null &&
      'rules' in configValue
    ) {
      const rules = (configValue as { rules: unknown }).rules;
      if (Array.isArray(rules)) {
        return rules
          .filter((item): item is string => typeof item === 'string')
          .filter((item) => item.trim().length > 0);
      }
    }
    return [];
  }

  async updateConfigs(configs: SystemConfig): Promise<void> {
    for (const [key, value] of Object.entries(configs)) {
      if (value !== undefined && value !== null) {
        await this.upsert(key, value);
      }
    }
  }

  async delete(configKey: string): Promise<void> {
    // Delete all entries with this key (both main and type-specific)
    await this.prisma.systemConfig.deleteMany({
      where: { configKey },
    });
  }

  async deleteByKeyAndAgentType(
    configKey: string,
    agentType: AgentType | null
  ): Promise<void> {
    await this.prisma.systemConfig.delete({
      where: {
        configKey_agentType: {
          configKey,
          agentType,
        },
      },
    });
  }
}
