import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { AgentRepository } from './agent.repository';
import { AgentResponse } from '../common/interfaces/agent.interface';
import { ERROR_MESSAGES } from '../common/constants/error-messages.constants.js';

@Injectable()
export class AgentService {
  constructor(private readonly agentRepository: AgentRepository) {}

  async findAll(userId: string): Promise<AgentResponse[]> {
    return this.agentRepository.findAll(userId);
  }

  async findById(id: number, userId: string): Promise<AgentResponse> {
    const agent = await this.agentRepository.findByIdWithConfig(id, userId);
    if (!agent) {
      throw new HttpException(ERROR_MESSAGES.AGENT_NOT_FOUND, HttpStatus.NOT_FOUND);
    }
    // Convert AgentWithConfig to AgentResponse
    const agentResponse = await this.agentRepository.findById(id);
    if (!agentResponse) {
      throw new HttpException(ERROR_MESSAGES.AGENT_NOT_FOUND, HttpStatus.NOT_FOUND);
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
    // User is automatically synced to DB by ClerkGuard

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      throw new HttpException(ERROR_MESSAGES.AGENT_NAME_REQUIRED, HttpStatus.BAD_REQUEST);
    }

    const existingAgent = await this.agentRepository.findByName(name, userId);
    if (existingAgent) {
      throw new HttpException(
        ERROR_MESSAGES.AGENT_NAME_ALREADY_EXISTS,
        HttpStatus.CONFLICT
      );
    }

    const agent = await this.agentRepository.create(
      userId,
      name,
      description,
      avatarUrl
    );

    // Set configs if provided
    if (configs) {
      await this.agentRepository.updateConfigs(agent.id, configs);
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
    const agent = await this.agentRepository.findByIdAndUserId(id, userId);
    if (!agent) {
      throw new HttpException(ERROR_MESSAGES.AGENT_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      throw new HttpException(ERROR_MESSAGES.AGENT_NAME_REQUIRED, HttpStatus.BAD_REQUEST);
    }

    // Check if name is being changed and if it conflicts with another agent
    if (name !== agent.name) {
      const existingAgent = await this.agentRepository.findByName(name, userId);
      if (existingAgent && existingAgent.id !== id) {
        throw new HttpException(
          ERROR_MESSAGES.AGENT_NAME_ALREADY_EXISTS,
          HttpStatus.CONFLICT
        );
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
      throw new HttpException(ERROR_MESSAGES.AGENT_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    // Update configs if provided
    if (configs) {
      await this.agentRepository.updateConfigs(id, configs);
    }

    return updated;
  }

  async delete(id: number, userId: string): Promise<void> {
    const agent = await this.agentRepository.findByIdAndUserId(id, userId);
    if (!agent) {
      throw new HttpException(ERROR_MESSAGES.AGENT_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    // Delete the agent - Prisma will cascade delete all related data (sessions, messages, configs, memories)
    await this.agentRepository.delete(id, userId);
  }
}
