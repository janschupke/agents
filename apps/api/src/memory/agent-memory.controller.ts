import {
  Controller,
  Get,
  Put,
  Delete,
  Post,
  Param,
  Body,
  ParseIntPipe,
  Query,
  Logger,
} from '@nestjs/common';
import { AgentMemoryService } from './agent-memory.service';
import { AgentMemoryRepository } from './agent-memory.repository';
import { MemorySummaryService } from './services/memory-summary.service';
import { User } from '../auth/decorators/user.decorator';
import { AuthenticatedUser } from '../common/types/auth.types';
import { ApiCredentialsService } from '../api-credentials/api-credentials.service';
import { MAGIC_STRINGS } from '../common/constants/error-messages.constants.js';
import {
  UpdateMemoryDto,
  MemoryQueryDto,
} from '../common/dto/message-translation.dto';
import {
  MemoryNotFoundException,
  ApiKeyRequiredException,
} from '../common/exceptions';

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

@Controller('api/agents/:agentId/memories')
export class AgentMemoryController {
  private readonly logger = new Logger(AgentMemoryController.name);

  constructor(
    private readonly memoryService: AgentMemoryService,
    private readonly memoryRepository: AgentMemoryRepository,
    private readonly memorySummaryService: MemorySummaryService,
    private readonly apiCredentialsService: ApiCredentialsService
  ) {}

  @Get()
  async getMemories(
    @Param('agentId', ParseIntPipe) agentId: number,
    @User() user: AuthenticatedUser,
    @Query() query: MemoryQueryDto
  ): Promise<AgentMemoryResponse[]> {
    this.logger.debug(
      `Getting memories for agent ${agentId}, user ${user.id}, limit: ${query.limit || 'none'}`
    );
    const memories = await this.memoryRepository.findAllByAgentId(
      agentId,
      user.id,
      query.limit
    );

    this.logger.debug(
      `Returning ${memories.length} memories for agent ${agentId}, user ${user.id}`
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

  @Get(':memoryId')
  async getMemory(
    @Param('agentId', ParseIntPipe) agentId: number,
    @Param('memoryId', ParseIntPipe) memoryId: number,
    @User() user: AuthenticatedUser
  ): Promise<AgentMemoryResponse> {
    const memories = await this.memoryRepository.findAllByAgentId(
      agentId,
      user.id
    );
    const memory = memories.find((m) => m.id === memoryId);

    if (!memory) {
      throw new MemoryNotFoundException(memoryId);
    }

    return {
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
    };
  }

  @Put(':memoryId')
  async updateMemory(
    @Param('agentId', ParseIntPipe) agentId: number,
    @Param('memoryId', ParseIntPipe) memoryId: number,
    @Body() body: UpdateMemoryDto,
    @User() user: AuthenticatedUser
  ): Promise<AgentMemoryResponse> {
    // Verify memory belongs to agent and user
    const memories = await this.memoryRepository.findAllByAgentId(
      agentId,
      user.id
    );
    const memory = memories.find((m) => m.id === memoryId);

    if (!memory) {
      throw new MemoryNotFoundException(memoryId);
    }

    const updated = await this.memoryRepository.update(memoryId, body.keyPoint);

    // Trigger summary generation asynchronously (don't block)
    const apiKey = await this.apiCredentialsService.getApiKey(
      user.id,
      MAGIC_STRINGS.OPENAI_PROVIDER
    );
    if (apiKey) {
      this.memorySummaryService
        .generateSummary(agentId, user.id, apiKey)
        .catch((error) => {
          this.logger.error(
            `Error generating memory summary after update:`,
            error
          );
        });
    }

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

  @Delete(':memoryId')
  async deleteMemory(
    @Param('agentId', ParseIntPipe) agentId: number,
    @Param('memoryId', ParseIntPipe) memoryId: number,
    @User() user: AuthenticatedUser
  ): Promise<void> {
    // Verify memory belongs to agent and user
    const memories = await this.memoryRepository.findAllByAgentId(
      agentId,
      user.id
    );
    const memory = memories.find((m) => m.id === memoryId);

    if (!memory) {
      throw new MemoryNotFoundException(memoryId);
    }

    await this.memoryRepository.delete(memoryId);

    // Trigger summary generation asynchronously (don't block)
    const apiKey = await this.apiCredentialsService.getApiKey(
      user.id,
      MAGIC_STRINGS.OPENAI_PROVIDER
    );
    if (apiKey) {
      this.memorySummaryService
        .generateSummary(agentId, user.id, apiKey)
        .catch((error) => {
          this.logger.error(
            `Error generating memory summary after delete:`,
            error
          );
        });
    }
  }

  @Post('summarize')
  async summarizeMemories(
    @Param('agentId', ParseIntPipe) agentId: number,
    @User() user: AuthenticatedUser
  ): Promise<{ message: string }> {
    const apiKey = await this.apiCredentialsService.getApiKey(
      user.id,
      MAGIC_STRINGS.OPENAI_PROVIDER
    );
    if (!apiKey) {
      throw new ApiKeyRequiredException();
    }

    await this.memoryService.summarizeMemories(agentId, user.id, apiKey);

    return { message: 'Memories summarized successfully' };
  }

  @Post('generate-summary')
  async generateMemorySummary(
    @Param('agentId', ParseIntPipe) agentId: number,
    @User() user: AuthenticatedUser
  ): Promise<{ message: string }> {
    const apiKey = await this.apiCredentialsService.getApiKey(
      user.id,
      MAGIC_STRINGS.OPENAI_PROVIDER
    );
    if (!apiKey) {
      throw new ApiKeyRequiredException();
    }

    await this.memorySummaryService.generateSummary(agentId, user.id, apiKey);

    return { message: 'Memory summary generated successfully' };
  }
}
