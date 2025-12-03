import {
  Injectable,
  Logger,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { AgentRepository } from './agent.repository';
import { AgentResponse } from '../common/interfaces/agent.interface';
import { AgentNotFoundException } from '../common/exceptions';
import { ERROR_MESSAGES } from '../common/constants/error-messages.constants.js';

@Injectable()
export class AgentService {
  private readonly logger = new Logger(AgentService.name);

  constructor(private readonly agentRepository: AgentRepository) {}

  async findAll(userId: string): Promise<AgentResponse[]> {
    this.logger.debug(`Finding all agents for user ${userId}`);
    return this.agentRepository.findAll(userId);
  }

  async findById(id: number, userId: string): Promise<AgentResponse> {
    this.logger.debug(`Finding agent ${id} for user ${userId}`);
    const agent = await this.agentRepository.findByIdWithConfig(id, userId);
    if (!agent) {
      this.logger.warn(`Agent ${id} not found for user ${userId}`);
      throw new AgentNotFoundException(id);
    }
    // Convert AgentWithConfig to AgentResponse
    const agentResponse = await this.agentRepository.findById(id);
    if (!agentResponse) {
      this.logger.warn(`Agent ${id} not found`);
      throw new AgentNotFoundException(id);
    }
    return {
      ...agentResponse,
      configs: agent.configs,
    };
  }

  async create(
    userId: string,
    name: string,
    description?: string,
    avatarUrl?: string,
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
      avatarUrl
    );
    this.logger.log(`Created agent ${agent.id} "${name}"`);

    // Set configs if provided
    if (configs) {
      await this.agentRepository.updateConfigs(agent.id, configs);
      this.logger.debug(`Updated configs for agent ${agent.id}`);
    }

    return agent;
  }

  async update(
    id: number,
    userId: string,
    name: string,
    description?: string,
    avatarUrl?: string,
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
      avatarUrl
    );
    if (!updated) {
      this.logger.warn(`Failed to update agent ${id}`);
      throw new AgentNotFoundException(id);
    }

    // Update configs if provided
    if (configs) {
      await this.agentRepository.updateConfigs(id, configs);
      this.logger.debug(`Updated configs for agent ${id}`);
    }

    this.logger.log(`Successfully updated agent ${id}`);
    return updated;
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
}
