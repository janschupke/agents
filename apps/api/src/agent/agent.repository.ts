import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { Agent } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { AgentWithConfig } from '../common/interfaces/agent.interface';
import { AgentType } from '../common/enums/agent-type.enum';

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
    });
  }

  async findByName(name: string, userId: string): Promise<Agent | null> {
    return this.prisma.agent.findFirst({
      where: { name, userId },
    });
  }

  async findConfigsByAgentId(
    agentId: number
  ): Promise<Record<string, unknown>> {
    // Read configs from Agent table columns (new approach)
    const agent = await this.prisma.agent.findUnique({
      where: { id: agentId },
      select: {
        temperature: true,
        systemPrompt: true,
        behaviorRules: true,
        model: true,
        maxTokens: true,
        responseLength: true,
        age: true,
        gender: true,
        personality: true,
        sentiment: true,
        interests: true,
        availability: true,
      },
    });

    if (!agent) {
      return {};
    }

    // Build configs object from Agent columns
    const configs: Record<string, unknown> = {};
    if (agent.temperature !== null && agent.temperature !== undefined) {
      configs.temperature = agent.temperature;
    }
    if (agent.systemPrompt !== null && agent.systemPrompt !== undefined) {
      configs.system_prompt = agent.systemPrompt;
    }
    if (agent.behaviorRules !== null && agent.behaviorRules !== undefined) {
      configs.behavior_rules = agent.behaviorRules;
    }
    if (agent.model !== null && agent.model !== undefined) {
      configs.model = agent.model;
    }
    if (agent.maxTokens !== null && agent.maxTokens !== undefined) {
      configs.max_tokens = agent.maxTokens;
    }
    if (agent.responseLength !== null && agent.responseLength !== undefined) {
      configs.response_length = agent.responseLength;
    }
    if (agent.age !== null && agent.age !== undefined) {
      configs.age = agent.age;
    }
    if (agent.gender !== null && agent.gender !== undefined) {
      configs.gender = agent.gender;
    }
    if (agent.personality !== null && agent.personality !== undefined) {
      configs.personality = agent.personality;
    }
    if (agent.sentiment !== null && agent.sentiment !== undefined) {
      configs.sentiment = agent.sentiment;
    }
    if (agent.interests !== null && agent.interests !== undefined) {
      configs.interests = agent.interests;
    }
    if (agent.availability !== null && agent.availability !== undefined) {
      configs.availability = agent.availability;
    }

    // Fallback to AgentConfig for backward compatibility (if Agent columns are empty)
    if (Object.keys(configs).length === 0) {
      const oldConfigs = await this.prisma.agentConfig.findMany({
        where: { agentId },
        select: {
          configKey: true,
          configValue: true,
        },
      });

      return oldConfigs.reduce(
        (acc, item) => {
          acc[item.configKey] = item.configValue;
          return acc;
        },
        {} as Record<string, unknown>
      );
    }

    return configs;
  }

  async findByIdWithConfig(
    id: number,
    userId: string
  ): Promise<AgentWithConfig | null> {
    // Load agent with all fields including configs
    const agent = await this.findByIdAndUserId(id, userId);
    if (!agent) {
      return null;
    }

    // Get configs from Agent table columns
    const configs = await this.findConfigsByAgentId(id);

    return {
      id: agent.id,
      name: agent.name,
      description: agent.description,
      avatarUrl: agent.avatarUrl,
      agentType: agent.agentType as AgentType | null,
      language: agent.language,
      configs,
    };
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
    avatarUrl?: string,
    agentType: AgentType = AgentType.GENERAL,
    language?: string
  ): Promise<Agent> {
    return this.prisma.agent.create({
      data: {
        userId,
        name,
        description: description || null,
        avatarUrl: avatarUrl || null,
        agentType,
        language: language || null,
      },
    });
  }

  async update(
    id: number,
    userId: string,
    name: string,
    description?: string,
    avatarUrl?: string,
    agentType?: AgentType,
    language?: string
  ): Promise<Agent | null> {
    // First verify the agent belongs to the user
    const agent = await this.findByIdAndUserId(id, userId);
    if (!agent) {
      return null;
    }

    return this.prisma.agent.update({
      where: { id },
      data: {
        name,
        description: description || null,
        avatarUrl: avatarUrl !== undefined ? avatarUrl || null : undefined,
        agentType: agentType !== undefined ? agentType : undefined,
        language: language !== undefined ? language || null : undefined,
      },
    });
  }

  async updateConfigs(
    agentId: number,
    configs: Record<string, unknown>
  ): Promise<void> {
    // Map config keys to Agent table column names
    const updateData: Prisma.AgentUpdateInput = {};

    if (configs.temperature !== undefined) {
      updateData.temperature = configs.temperature as number | null;
    }
    if (configs.system_prompt !== undefined) {
      updateData.systemPrompt = (configs.system_prompt as string) || null;
    }
    if (configs.behavior_rules !== undefined) {
      updateData.behaviorRules = configs.behavior_rules
        ? (configs.behavior_rules as Prisma.InputJsonValue)
        : Prisma.JsonNull;
    }
    if (configs.model !== undefined) {
      updateData.model = (configs.model as string) || null;
    }
    if (configs.max_tokens !== undefined) {
      updateData.maxTokens = (configs.max_tokens as number) || null;
    }
    if (configs.response_length !== undefined) {
      updateData.responseLength = (configs.response_length as string) || null;
    }
    if (configs.age !== undefined) {
      updateData.age = (configs.age as number) ?? null;
    }
    if (configs.gender !== undefined) {
      updateData.gender = (configs.gender as string) || null;
    }
    if (configs.personality !== undefined) {
      updateData.personality = (configs.personality as string) || null;
    }
    if (configs.sentiment !== undefined) {
      updateData.sentiment = (configs.sentiment as string) || null;
    }
    if (configs.interests !== undefined) {
      updateData.interests = configs.interests
        ? (configs.interests as Prisma.InputJsonValue)
        : Prisma.JsonNull;
    }
    if (configs.availability !== undefined) {
      updateData.availability = (configs.availability as string) || null;
    }

    // Single UPDATE operation instead of N upserts
    await this.prisma.agent.update({
      where: { id: agentId },
      data: updateData,
    });

    // Also update AgentConfig for backward compatibility during transition
    // This can be removed in a future migration
    for (const [key, value] of Object.entries(configs)) {
      if (value !== undefined && value !== null) {
        await this.prisma.agentConfig.upsert({
          where: {
            agentId_configKey: {
              agentId,
              configKey: key,
            },
          },
          update: {
            configValue: value as Prisma.InputJsonValue,
          },
          create: {
            agentId,
            configKey: key,
            configValue: value as Prisma.InputJsonValue,
          },
        });
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
