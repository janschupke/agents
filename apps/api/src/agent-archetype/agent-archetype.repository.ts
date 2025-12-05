import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SortOrder } from '@openai/shared-types';
import { AgentArchetype, AgentType } from '@prisma/client';
import {
  CreateAgentArchetypeDto,
  UpdateAgentArchetypeDto,
} from '../common/dto/agent-archetype.dto';

@Injectable()
export class AgentArchetypeRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<AgentArchetype[]> {
    return this.prisma.agentArchetype.findMany({
      orderBy: { createdAt: SortOrder.DESC },
    });
  }

  async findById(id: number): Promise<AgentArchetype | null> {
    return this.prisma.agentArchetype.findUnique({
      where: { id },
    });
  }

  async create(data: CreateAgentArchetypeDto): Promise<AgentArchetype> {
    return this.prisma.agentArchetype.create({
      data: {
        name: data.name,
        description: data.description || null,
        avatarUrl: data.avatarUrl || null,
        agentType: data.agentType || AgentType.GENERAL,
        language: data.language || null,
        temperature: data.configs?.temperature ?? null,
        systemPrompt: data.configs?.system_prompt || null,
        behaviorRules: data.configs?.behavior_rules
          ? typeof data.configs.behavior_rules === 'string'
            ? { rules: [data.configs.behavior_rules] }
            : Array.isArray(data.configs.behavior_rules)
              ? { rules: data.configs.behavior_rules }
              : data.configs.behavior_rules
          : undefined,
        model: data.configs?.model || null,
        maxTokens: data.configs?.max_tokens ?? null,
        responseLength: data.configs?.response_length || null,
        age: data.configs?.age ?? null,
        gender: data.configs?.gender || null,
        personality: data.configs?.personality || null,
        sentiment: data.configs?.sentiment || null,
        interests: data.configs?.interests ? data.configs.interests : undefined,
        availability: data.configs?.availability || null,
      },
    });
  }

  async update(
    id: number,
    data: UpdateAgentArchetypeDto
  ): Promise<AgentArchetype> {
    return this.prisma.agentArchetype.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description ?? null,
        avatarUrl: data.avatarUrl ?? null,
        agentType: data.agentType ?? null,
        language: data.language ?? null,
        temperature: data.configs?.temperature ?? null,
        systemPrompt: data.configs?.system_prompt ?? null,
        behaviorRules: data.configs?.behavior_rules
          ? typeof data.configs.behavior_rules === 'string'
            ? { rules: [data.configs.behavior_rules] }
            : Array.isArray(data.configs.behavior_rules)
              ? { rules: data.configs.behavior_rules }
              : data.configs.behavior_rules
          : undefined,
        model: data.configs?.model ?? null,
        maxTokens: data.configs?.max_tokens ?? null,
        responseLength: data.configs?.response_length ?? null,
        age: data.configs?.age ?? null,
        gender: data.configs?.gender ?? null,
        personality: data.configs?.personality ?? null,
        sentiment: data.configs?.sentiment ?? null,
        interests: data.configs?.interests ?? undefined,
        availability: data.configs?.availability ?? null,
      },
    });
  }

  async delete(id: number): Promise<void> {
    await this.prisma.agentArchetype.delete({
      where: { id },
    });
  }
}
