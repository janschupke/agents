import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type {
  SystemConfig as PrismaSystemConfig,
  Prisma,
  AgentType,
} from '@prisma/client';
import { SystemConfig } from '../common/types/config.types';
import { SortOrder } from '@openai/shared-types';

@Injectable()
export class SystemConfigRepository {
  private readonly logger = new Logger(SystemConfigRepository.name);

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
    // For null agentType (main/default), use findFirst
    // because Prisma's unique constraint doesn't handle null well with findUnique
    if (agentType === null) {
      return this.prisma.systemConfig.findFirst({
        where: {
          configKey,
          agentType: null,
        },
      });
    }

    // For non-null agentType, use the unique constraint
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
      orderBy: { configKey: SortOrder.ASC },
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
    // For null agentType (main/default), use findFirst + update/create pattern
    // because Prisma's unique constraint doesn't handle null well
    if (agentType === null) {
      const existing = await this.prisma.systemConfig.findFirst({
        where: {
          configKey,
          agentType: null,
        },
      });

      if (existing) {
        return this.prisma.systemConfig.update({
          where: { id: existing.id },
          data: {
            configValue: configValue as Prisma.InputJsonValue,
          },
        });
      } else {
        return this.prisma.systemConfig.create({
          data: {
            configKey,
            configValue: configValue as Prisma.InputJsonValue,
            agentType: null,
          },
        });
      }
    }

    // For non-null agentType, use the unique constraint
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
      this.logger.debug(
        `Looking for type-specific behavior rules for agent type: ${agentType}`
      );
      const typeSpecific = await this.findByKeyAndAgentType(
        'behavior_rules',
        agentType
      );
      if (typeSpecific) {
        this.logger.debug(
          `Found type-specific config for ${agentType}, configValue type: ${typeof typeSpecific.configValue}`
        );
        if (typeSpecific.configValue) {
          const rules = this.parseBehaviorRules(typeSpecific.configValue);
          this.logger.debug(
            `Parsed ${rules.length} rules from type-specific config for ${agentType}`
          );
          if (rules.length > 0) {
            return rules;
          }
        } else {
          this.logger.debug(
            `Type-specific config for ${agentType} has no configValue`
          );
        }
      } else {
        this.logger.debug(
          `No type-specific behavior rules found for agent type: ${agentType}, falling back to main`
        );
      }
    }

    // Fall back to main rules
    this.logger.debug('Looking for main (null) behavior rules');
    const main = await this.findByKeyAndAgentType('behavior_rules', null);
    if (main) {
      this.logger.debug(
        `Found main config, configValue type: ${typeof main.configValue}`
      );
      if (main.configValue) {
        const rules = this.parseBehaviorRules(main.configValue);
        this.logger.debug(`Parsed ${rules.length} rules from main config`);
        return rules;
      } else {
        this.logger.debug('Main config has no configValue');
      }
    } else {
      this.logger.debug('No main behavior rules found');
    }

    this.logger.debug('Returning empty array - no behavior rules found');
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
    // For null agentType (main/default), find first then delete
    if (agentType === null) {
      const existing = await this.prisma.systemConfig.findFirst({
        where: {
          configKey,
          agentType: null,
        },
      });
      if (existing) {
        await this.prisma.systemConfig.delete({
          where: { id: existing.id },
        });
      }
      return;
    }

    // For non-null agentType, use the unique constraint
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
