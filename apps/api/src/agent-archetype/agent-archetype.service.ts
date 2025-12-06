import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { AgentArchetypeRepository } from './agent-archetype.repository';
import {
  CreateAgentArchetypeDto,
  UpdateAgentArchetypeDto,
  AgentArchetypeResponse,
} from '../common/dto/agent-archetype.dto';
import { AgentType, Language } from '@openai/shared-types';

@Injectable()
export class AgentArchetypeService {
  private readonly logger = new Logger(AgentArchetypeService.name);

  constructor(private readonly archetypeRepository: AgentArchetypeRepository) {}

  async findAll(): Promise<AgentArchetypeResponse[]> {
    this.logger.log('Fetching all agent archetypes');
    const archetypes = await this.archetypeRepository.findAll();
    return archetypes.map(this.mapToResponse);
  }

  async findById(id: number): Promise<AgentArchetypeResponse> {
    this.logger.log(`Fetching agent archetype ${id}`);
    const archetype = await this.archetypeRepository.findById(id);
    if (!archetype) {
      this.logger.warn(`Agent archetype ${id} not found`);
      throw new NotFoundException(`Agent archetype with ID ${id} not found`);
    }
    return this.mapToResponse(archetype);
  }

  async create(data: CreateAgentArchetypeDto): Promise<AgentArchetypeResponse> {
    this.logger.log(`Creating agent archetype "${data.name}"`);
    const archetype = await this.archetypeRepository.create(data);
    this.logger.log(`Created agent archetype ${archetype.id} "${data.name}"`);
    return this.mapToResponse(archetype);
  }

  async update(
    id: number,
    data: UpdateAgentArchetypeDto
  ): Promise<AgentArchetypeResponse> {
    this.logger.log(`Updating agent archetype ${id}`);
    const existing = await this.archetypeRepository.findById(id);
    if (!existing) {
      this.logger.warn(`Agent archetype ${id} not found`);
      throw new NotFoundException(`Agent archetype with ID ${id} not found`);
    }
    const archetype = await this.archetypeRepository.update(id, data);
    this.logger.log(`Updated agent archetype ${id}`);
    return this.mapToResponse(archetype);
  }

  async delete(id: number): Promise<void> {
    this.logger.log(`Deleting agent archetype ${id}`);
    const existing = await this.archetypeRepository.findById(id);
    if (!existing) {
      this.logger.warn(`Agent archetype ${id} not found`);
      throw new NotFoundException(`Agent archetype with ID ${id} not found`);
    }
    await this.archetypeRepository.delete(id);
    this.logger.log(`Deleted agent archetype ${id}`);
  }

  private mapToResponse(archetype: {
    id: number;
    name: string;
    description: string | null;
    avatarUrl: string | null;
    agentType: string | null;
    language: string | null;
    createdAt: Date;
    updatedAt: Date;
    temperature: number | null;
    model: string | null;
    maxTokens: number | null;
    responseLength: string | null;
    age: number | null;
    gender: string | null;
    personality: string | null;
    sentiment: string | null;
    interests: unknown;
    availability: string | null;
  }): AgentArchetypeResponse {
    return {
      id: archetype.id,
      name: archetype.name,
      description: archetype.description || undefined,
      avatarUrl: archetype.avatarUrl || undefined,
      agentType: archetype.agentType
        ? (archetype.agentType as AgentType)
        : undefined,
      language: archetype.language
        ? (archetype.language as Language)
        : undefined,
      createdAt: archetype.createdAt,
      updatedAt: archetype.updatedAt,
      configs: {
        temperature: archetype.temperature ?? undefined,
        model: archetype.model || undefined,
        max_tokens: archetype.maxTokens ?? undefined,
        response_length: archetype.responseLength || undefined,
        age: archetype.age ?? undefined,
        gender: archetype.gender || undefined,
        personality: archetype.personality || undefined,
        sentiment: archetype.sentiment || undefined,
        interests: archetype.interests || undefined,
        availability: archetype.availability || undefined,
      },
    };
  }
}
