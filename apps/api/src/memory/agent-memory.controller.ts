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
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { AgentMemoryService } from './agent-memory.service';
import { AgentMemoryRepository } from './agent-memory.repository';
import { User } from '../auth/decorators/user.decorator';
import { AuthenticatedUser } from '../common/types/auth.types';
import { ApiCredentialsService } from '../api-credentials/api-credentials.service';
import { ERROR_MESSAGES, MAGIC_STRINGS } from '../common/constants/error-messages.constants.js';

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

interface UpdateMemoryDto {
  keyPoint: string;
}

@Controller('api/agents/:agentId/memories')
export class AgentMemoryController {
  constructor(
    private readonly memoryService: AgentMemoryService,
    private readonly memoryRepository: AgentMemoryRepository,
    private readonly apiCredentialsService: ApiCredentialsService
  ) {}

  @Get()
  async getMemories(
    @Param('agentId', ParseIntPipe) agentId: number,
    @User() user: AuthenticatedUser,
    @Query('limit') limit?: string,
    @Query('offset') _offset?: string
  ): Promise<AgentMemoryResponse[]> {
    const memories = await this.memoryRepository.findAllByAgentId(
      agentId,
      user.id,
      limit ? parseInt(limit, MAGIC_STRINGS.PARSE_INT_BASE) : undefined
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
      throw new HttpException(
        ERROR_MESSAGES.MEMORY_NOT_FOUND,
        HttpStatus.NOT_FOUND
      );
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
      throw new HttpException(
        ERROR_MESSAGES.MEMORY_NOT_FOUND,
        HttpStatus.NOT_FOUND
      );
    }

    const updated = await this.memoryRepository.update(
      memoryId,
      body.keyPoint
    );

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
      throw new HttpException(
        ERROR_MESSAGES.MEMORY_NOT_FOUND,
        HttpStatus.NOT_FOUND
      );
    }

    await this.memoryRepository.delete(memoryId);
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
      throw new HttpException(
        ERROR_MESSAGES.OPENAI_API_KEY_REQUIRED,
        HttpStatus.BAD_REQUEST
      );
    }

    await this.memoryService.summarizeMemories(agentId, user.id, apiKey);

    return { message: 'Memories summarized successfully' };
  }
}
