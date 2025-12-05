import {
  Controller,
  Get,
  Put,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  Logger,
} from '@nestjs/common';
import { AgentService } from '../agent/agent.service';
import { AgentRepository } from '../agent/agent.repository';
import { AgentMemoryRepository } from '../memory/agent-memory.repository';
import { Roles } from '../auth/decorators/roles.decorator';
import { UseGuards } from '@nestjs/common';
import { RolesGuard } from '../auth/roles.guard';
import { UpdateAgentDto } from '../common/dto/agent.dto';
import { AgentResponse } from '../common/interfaces/agent.interface';
import { AgentType } from '../common/enums/agent-type.enum';
import { API_ROUTES } from '../common/constants/api-routes.constants.js';
import { UpdateMemoryDto } from '../common/dto/message-translation.dto';
import {
  MemoryNotFoundException,
  AgentNotFoundException,
} from '../common/exceptions';

interface AgentWithStats extends AgentResponse {
  totalMessages: number;
  totalTokens: number;
}

interface AgentMemoryResponse {
  id: number;
  agentId: number;
  userId: string;
  keyPoint: string;
  context?: {
    sessionId?: number;
    sessionName?: string | null;
    messageCount?: number;
  };
  createdAt: string;
  updatedAt: string;
}

@Controller(API_ROUTES.ADMIN.AGENTS.BASE)
@UseGuards(RolesGuard)
@Roles('admin')
export class AdminAgentController {
  private readonly logger = new Logger(AdminAgentController.name);

  constructor(
    private readonly agentService: AgentService,
    private readonly agentRepository: AgentRepository,
    private readonly memoryRepository: AgentMemoryRepository
  ) {}

  @Get()
  async getAllAgents(): Promise<AgentWithStats[]> {
    this.logger.log('Getting all agents (admin)');
    const agents = await this.agentRepository.findAllForAdmin();

    // Get stats for each agent
    const agentsWithStats = await Promise.all(
      agents.map(async (agent) => {
        const [totalMessages, totalTokens] = await Promise.all([
          this.agentRepository.getMessageCount(agent.id),
          this.agentRepository.getTokenCount(agent.id),
        ]);

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
          totalMessages,
          totalTokens,
        };
      })
    );

    return agentsWithStats;
  }

  @Get(':id')
  async getAgent(
    @Param('id', ParseIntPipe) id: number
  ): Promise<AgentResponse> {
    this.logger.log(`Getting agent ${id} (admin)`);
    const agent = await this.agentRepository.findById(id);
    if (!agent) {
      throw new AgentNotFoundException(id);
    }

    const configs = await this.agentRepository.findConfigsByAgentId(id);

    return {
      id: agent.id,
      userId: agent.userId,
      name: agent.name,
      description: agent.description,
      avatarUrl: agent.avatarUrl,
      agentType: agent.agentType as AgentType | null,
      language: agent.language,
      createdAt: agent.createdAt,
      configs,
      memorySummary: agent.memorySummary,
    };
  }

  @Put(':id')
  async updateAgent(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateAgentDto
  ): Promise<AgentResponse> {
    this.logger.log(`Updating agent ${id} (admin)`);
    const agent = await this.agentRepository.findById(id);
    if (!agent) {
      throw new AgentNotFoundException(id);
    }

    // Update agent (admin can update any agent)
    // Convert AgentConfigDto to Record<string, unknown> for service
    const configs = body.configs
      ? (body.configs as unknown as Record<string, unknown>)
      : undefined;
    return await this.agentService.update(
      id,
      agent.userId, // Use agent's userId for update
      body.name,
      body.description,
      body.avatarUrl,
      body.agentType,
      body.language,
      configs
    );
  }

  @Delete(':id')
  async deleteAgent(@Param('id', ParseIntPipe) id: number): Promise<void> {
    this.logger.log(`Deleting agent ${id} (admin)`);
    const agent = await this.agentRepository.findById(id);
    if (!agent) {
      throw new AgentNotFoundException(id);
    }

    // Delete agent (admin can delete any agent)
    await this.agentService.delete(id, agent.userId);
  }

  @Get(':id/memories')
  async getMemories(
    @Param('id', ParseIntPipe) agentId: number
  ): Promise<AgentMemoryResponse[]> {
    this.logger.log(`Getting memories for agent ${agentId} (admin)`);
    const agent = await this.agentRepository.findById(agentId);
    if (!agent) {
      throw new AgentNotFoundException(agentId);
    }

    const memories = await this.memoryRepository.findAllByAgentId(
      agentId,
      agent.userId,
      undefined
    );

    return memories.map((memory) => ({
      id: memory.id,
      agentId: memory.agentId,
      userId: memory.userId,
      keyPoint: memory.keyPoint,
      context: memory.context as {
        sessionId?: number;
        sessionName?: string | null;
        messageCount?: number;
      },
      createdAt: memory.createdAt.toISOString(),
      updatedAt: memory.updatedAt.toISOString(),
    }));
  }

  @Put(':id/memories/:memoryId')
  async updateMemory(
    @Param('id', ParseIntPipe) agentId: number,
    @Param('memoryId', ParseIntPipe) memoryId: number,
    @Body() body: UpdateMemoryDto
  ): Promise<AgentMemoryResponse> {
    this.logger.log(
      `Updating memory ${memoryId} for agent ${agentId} (admin)`
    );
    const agent = await this.agentRepository.findById(agentId);
    if (!agent) {
      throw new AgentNotFoundException(agentId);
    }

    const memories = await this.memoryRepository.findAllByAgentId(
      agentId,
      agent.userId,
      undefined
    );
    const memory = memories.find((m) => m.id === memoryId);

    if (!memory) {
      throw new MemoryNotFoundException(memoryId);
    }

    const updated = await this.memoryRepository.update(memoryId, body.keyPoint);

    return {
      id: updated.id,
      agentId: updated.agentId,
      userId: updated.userId,
      keyPoint: updated.keyPoint,
      context: updated.context as {
        sessionId?: number;
        sessionName?: string | null;
        messageCount?: number;
      },
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  @Delete(':id/memories/:memoryId')
  async deleteMemory(
    @Param('id', ParseIntPipe) agentId: number,
    @Param('memoryId', ParseIntPipe) memoryId: number
  ): Promise<void> {
    this.logger.log(
      `Deleting memory ${memoryId} for agent ${agentId} (admin)`
    );
    const agent = await this.agentRepository.findById(agentId);
    if (!agent) {
      throw new AgentNotFoundException(agentId);
    }

    const memories = await this.memoryRepository.findAllByAgentId(
      agentId,
      agent.userId,
      undefined
    );
    const memory = memories.find((m) => m.id === memoryId);

    if (!memory) {
      throw new MemoryNotFoundException(memoryId);
    }

    await this.memoryRepository.delete(memoryId);
  }
}
