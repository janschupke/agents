import {
  Injectable,
  Logger,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { AgentRepository } from './agent.repository';
import { AgentResponse } from '../common/interfaces/agent.interface';
import { AgentNotFoundException } from '../common/exceptions';
import { ERROR_MESSAGES } from '../common/constants/error-messages.constants.js';
import { AgentType } from '@openai/shared-types';
import { DEFAULT_AGENT_CONFIG } from '../common/constants/api.constants';
import { SessionRepository } from '../session/session.repository';
import { AgentArchetypeService } from '../agent-archetype/agent-archetype.service';

@Injectable()
export class AgentService {
  private readonly logger = new Logger(AgentService.name);

  constructor(
    private readonly agentRepository: AgentRepository,
    private readonly sessionRepository: SessionRepository,
    private readonly archetypeService: AgentArchetypeService
  ) {}

  async findAll(userId: string): Promise<AgentResponse[]> {
    this.logger.debug(`Finding all agents for user ${userId}`);
    const agents = await this.agentRepository.findAllWithConfig(userId);
    const agentRecords = await this.agentRepository.findAll(userId);
    
    // Create a map for quick lookup
    const agentMap = new Map(agentRecords.map((a) => [a.id, a]));
    
    return agents.map((agent) => {
      const agentRecord = agentMap.get(agent.id);
      return {
        id: agent.id,
        userId: agentRecord?.userId || userId,
        name: agent.name,
        description: agent.description,
        avatarUrl: agent.avatarUrl,
        agentType: agent.agentType as AgentType | null,
        language: agent.language,
        createdAt: agentRecord?.createdAt || new Date(),
        configs: agent.configs,
        memorySummary: agentRecord?.memorySummary || null,
      };
    });
  }

  async findById(id: number, userId: string): Promise<AgentResponse> {
    this.logger.debug(`Finding agent ${id} for user ${userId}`);
    const agent = await this.agentRepository.findByIdWithConfig(id, userId);
    if (!agent) {
      this.logger.warn(`Agent ${id} not found for user ${userId}`);
      throw new AgentNotFoundException(id);
    }
    // Convert AgentWithConfig to AgentResponse
    const agentRecord = await this.agentRepository.findById(id);
    if (!agentRecord) {
      this.logger.warn(`Agent ${id} not found`);
      throw new AgentNotFoundException(id);
    }
    return {
      id: agentRecord.id,
      userId: agentRecord.userId,
      name: agentRecord.name,
      description: agentRecord.description,
      avatarUrl: agentRecord.avatarUrl,
      agentType: agentRecord.agentType as AgentType | null,
      language: agentRecord.language,
      createdAt: agentRecord.createdAt,
      configs: agent.configs,
      memorySummary: agentRecord.memorySummary,
    };
  }

  async create(
    userId: string,
    name: string,
    description?: string,
    avatarUrl?: string,
    agentType?: AgentType,
    language?: string,
    configs?: Record<string, unknown>
  ): Promise<AgentResponse> {
    this.logger.log(`Creating agent "${name}" for user ${userId}`);
    // User is automatically synced to DB by ClerkGuard

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      this.logger.warn(`Invalid agent name provided by user ${userId}`);
      throw new BadRequestException(ERROR_MESSAGES.AGENT_NAME_REQUIRED);
    }

    const existingAgent = await this.agentRepository.findByName(name, userId);
    if (existingAgent) {
      this.logger.warn(
        `Agent name "${name}" already exists for user ${userId}`
      );
      throw new ConflictException(ERROR_MESSAGES.AGENT_NAME_ALREADY_EXISTS);
    }

    const agent = await this.agentRepository.create(
      userId,
      name,
      description,
      avatarUrl,
      agentType || AgentType.GENERAL, // Default to 'general'
      language
    );
    this.logger.log(`Created agent ${agent.id} "${name}"`);

    // Auto-create initial session for the agent
    const session = await this.sessionRepository.create(userId, agent.id);
    this.logger.log(
      `Created initial session ${session.id} for agent ${agent.id}`
    );

    // Merge provided configs with defaults to ensure all mandatory fields are set
    // This ensures response_length, personality, sentiment, and availability are always set
    const mergedConfigs = {
      ...DEFAULT_AGENT_CONFIG,
      ...(configs || {}),
    };

    // Always set configs (with defaults) to ensure mandatory fields are present
    await this.agentRepository.updateConfigs(agent.id, mergedConfigs);
    this.logger.debug(`Updated configs for agent ${agent.id} with defaults`);

    return {
      id: agent.id,
      userId: agent.userId,
      name: agent.name,
      description: agent.description,
      avatarUrl: agent.avatarUrl,
      agentType: agent.agentType as AgentType | null,
      language: agent.language,
      createdAt: agent.createdAt,
      memorySummary: agent.memorySummary,
    };
  }

  async update(
    id: number,
    userId: string,
    name: string,
    description?: string,
    avatarUrl?: string,
    agentType?: AgentType,
    language?: string,
    configs?: Record<string, unknown>
  ): Promise<AgentResponse> {
    this.logger.log(`Updating agent ${id} for user ${userId}`);
    const agent = await this.agentRepository.findByIdAndUserId(id, userId);
    if (!agent) {
      this.logger.warn(`Agent ${id} not found for user ${userId}`);
      throw new AgentNotFoundException(id);
    }

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      this.logger.warn(`Invalid agent name provided for agent ${id}`);
      throw new BadRequestException(ERROR_MESSAGES.AGENT_NAME_REQUIRED);
    }

    // Check if name is being changed and if it conflicts with another agent
    if (name !== agent.name) {
      const existingAgent = await this.agentRepository.findByName(name, userId);
      if (existingAgent && existingAgent.id !== id) {
        this.logger.warn(
          `Agent name "${name}" already exists for user ${userId}`
        );
        throw new ConflictException(ERROR_MESSAGES.AGENT_NAME_ALREADY_EXISTS);
      }
    }

    const updated = await this.agentRepository.update(
      id,
      userId,
      name,
      description,
      avatarUrl,
      agentType,
      language
    );
    if (!updated) {
      this.logger.warn(`Failed to update agent ${id}`);
      throw new AgentNotFoundException(id);
    }

    // Update configs if provided
    if (configs) {
      // Store only user-provided behavior rules (don't merge with auto-generated rules)
      // Auto-generated rules will be added during message preparation, not stored in DB
      await this.agentRepository.updateConfigs(id, configs);
      this.logger.debug(`Updated configs for agent ${id}`);
    }

    this.logger.log(`Successfully updated agent ${id}`);
    if (!updated) {
      throw new AgentNotFoundException(id);
    }
    return {
      id: updated.id,
      userId: updated.userId,
      name: updated.name,
      description: updated.description,
      avatarUrl: updated.avatarUrl,
      agentType: updated.agentType as AgentType | null,
      language: updated.language,
      createdAt: updated.createdAt,
    };
  }

  async delete(id: number, userId: string): Promise<void> {
    this.logger.log(`Deleting agent ${id} for user ${userId}`);
    const agent = await this.agentRepository.findByIdAndUserId(id, userId);
    if (!agent) {
      this.logger.warn(`Agent ${id} not found for user ${userId}`);
      throw new AgentNotFoundException(id);
    }

    // Delete the agent - Prisma will cascade delete all related data (sessions, messages, configs, memories)
    await this.agentRepository.delete(id, userId);
    this.logger.log(`Successfully deleted agent ${id}`);
  }

  async createFromArchetype(
    userId: string,
    archetypeId: number,
    name?: string
  ): Promise<AgentResponse> {
    this.logger.log(
      `Creating agent from archetype ${archetypeId} for user ${userId}`
    );

    // Fetch archetype
    const archetype = await this.archetypeService.findById(archetypeId);
    if (!archetype) {
      this.logger.warn(`Archetype ${archetypeId} not found`);
      throw new NotFoundException(`Archetype with ID ${archetypeId} not found`);
    }

    // Use archetype name if no name provided
    const agentName = name || archetype.name;

    // Create agent with archetype config
    const configs = archetype.configs || {};
    return await this.create(
      userId,
      agentName,
      archetype.description,
      archetype.avatarUrl,
      archetype.agentType,
      archetype.language,
      configs
    );
  }
}
