import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { Agent, Prisma } from '@prisma/client';
import { AgentWithConfig } from '../common/interfaces/bot.interface';
import { DEFAULT_AGENT_CONFIG } from '../common/constants/api.constants';

@Injectable()
export class AgentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: number): Promise<Agent | null> {
    return this.prisma.agent.findUnique({
      where: { id },
    });
  }

  async findByIdAndUserId(id: number, userId: string): Promise<Agent | null> {
    // Use findUnique with compound where for better index usage
    // This is more efficient than findFirst when we have a unique constraint
    return this.prisma.agent.findFirst({
      where: { id, userId },
      // Select only needed fields to reduce data transfer
      select: {
        id: true,
        userId: true,
        name: true,
        description: true,
        avatarUrl: true,
        createdAt: true,
      },
    });
  }

  async findByName(name: string, userId: string): Promise<Agent | null> {
    return this.prisma.agent.findFirst({
      where: { name, userId },
    });
  }

  async findConfigsByAgentId(agentId: number): Promise<Record<string, unknown>> {
    // Select only needed fields to reduce data transfer
    const configs = await this.prisma.agentConfig.findMany({
      where: { agentId },
      select: {
        configKey: true,
        configValue: true,
      },
    });

    // Use reduce for better performance than for loop
    return configs.reduce(
      (acc, item) => {
        acc[item.configKey] = item.configValue;
        return acc;
      },
      {} as Record<string, unknown>
    );
  }

  async findByIdWithConfig(
    id: number,
    userId: string
  ): Promise<AgentWithConfig | null> {
    // Load agent and configs in parallel to reduce total time
    const [agent, config] = await Promise.all([
      this.findByIdAndUserId(id, userId),
      this.findConfigsByAgentId(id),
    ]);

    if (!agent) {
      return null;
    }

    return {
      ...agent,
      configs: config,
    };
  }

  getDefaultAgentConfig(): Record<string, unknown> {
    return { ...DEFAULT_AGENT_CONFIG };
  }

  mergeAgentConfig(agentConfig: Record<string, unknown>): Record<string, unknown> {
    const defaults = this.getDefaultAgentConfig();
    return { ...defaults, ...agentConfig };
  }

  async findAll(userId: string): Promise<Agent[]> {
    return this.prisma.agent.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(
    userId: string,
    name: string,
    description?: string,
    avatarUrl?: string
  ): Promise<Agent> {
    return this.prisma.agent.create({
      data: {
        userId,
        name,
        description: description || null,
        avatarUrl: avatarUrl || null,
      },
    });
  }

  async update(
    id: number,
    userId: string,
    name: string,
    description?: string,
    avatarUrl?: string
  ): Promise<Agent> {
    // First verify the agent belongs to the user
    const agent = await this.findByIdAndUserId(id, userId);
    if (!agent) {
      return null as unknown as Agent; // Will be handled by service
    }

    return this.prisma.agent.update({
      where: { id },
      data: {
        name,
        description: description || null,
        avatarUrl: avatarUrl !== undefined ? (avatarUrl || null) : undefined,
      },
    });
  }

  async upsertConfig(
    agentId: number,
    configKey: string,
    configValue: unknown
  ): Promise<void> {
    // Skip if value is undefined or null
    if (configValue === undefined || configValue === null) {
      return;
    }

    await this.prisma.agentConfig.upsert({
      where: {
        agentId_configKey: {
          agentId,
          configKey,
        },
      },
      update: {
        configValue: configValue as Prisma.InputJsonValue,
      },
      create: {
        agentId,
        configKey,
        configValue: configValue as Prisma.InputJsonValue,
      },
    });
  }

  async updateConfigs(
    agentId: number,
    configs: Record<string, unknown>
  ): Promise<void> {
    // Upsert each config key, skipping undefined/null values
    for (const [key, value] of Object.entries(configs)) {
      if (value !== undefined && value !== null) {
        await this.upsertConfig(agentId, key, value);
      }
    }
  }

  async delete(id: number, userId: string): Promise<void> {
    // Verify the agent belongs to the user before deleting
    const agent = await this.findByIdAndUserId(id, userId);
    if (!agent) {
      return; // Will be handled by service
    }

    // Delete the agent - Prisma will cascade delete all related data (sessions, messages, configs)
    await this.prisma.agent.delete({
      where: { id },
    });
  }
}
