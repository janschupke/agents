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
    try {
      const memories = await this.memoryRepository.findAllByAgentId(
        agentId,
        user.id,
        limit ? parseInt(limit, 10) : undefined
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
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      const err = error as { message?: string };
      throw new HttpException(
        err.message || 'Unknown error',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(':memoryId')
  async getMemory(
    @Param('agentId', ParseIntPipe) agentId: number,
    @Param('memoryId', ParseIntPipe) memoryId: number,
    @User() user: AuthenticatedUser
  ): Promise<AgentMemoryResponse> {
    try {
      const memories = await this.memoryRepository.findAllByAgentId(
        agentId,
        user.id
      );
      const memory = memories.find((m) => m.id === memoryId);

      if (!memory) {
        throw new HttpException('Memory not found', HttpStatus.NOT_FOUND);
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
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      const err = error as { message?: string };
      throw new HttpException(
        err.message || 'Unknown error',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Put(':memoryId')
  async updateMemory(
    @Param('agentId', ParseIntPipe) agentId: number,
    @Param('memoryId', ParseIntPipe) memoryId: number,
    @Body() body: UpdateMemoryDto,
    @User() user: AuthenticatedUser
  ): Promise<AgentMemoryResponse> {
    try {
      // Verify memory belongs to agent and user
      const memories = await this.memoryRepository.findAllByAgentId(
        agentId,
        user.id
      );
      const memory = memories.find((m) => m.id === memoryId);

      if (!memory) {
        throw new HttpException('Memory not found', HttpStatus.NOT_FOUND);
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
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      const err = error as { message?: string };
      throw new HttpException(
        err.message || 'Unknown error',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Delete(':memoryId')
  async deleteMemory(
    @Param('agentId', ParseIntPipe) agentId: number,
    @Param('memoryId', ParseIntPipe) memoryId: number,
    @User() user: AuthenticatedUser
  ): Promise<void> {
    try {
      // Verify memory belongs to agent and user
      const memories = await this.memoryRepository.findAllByAgentId(
        agentId,
        user.id
      );
      const memory = memories.find((m) => m.id === memoryId);

      if (!memory) {
        throw new HttpException('Memory not found', HttpStatus.NOT_FOUND);
      }

      await this.memoryRepository.delete(memoryId);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      const err = error as { message?: string };
      throw new HttpException(
        err.message || 'Unknown error',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('summarize')
  async summarizeMemories(
    @Param('agentId', ParseIntPipe) agentId: number,
    @User() user: AuthenticatedUser
  ): Promise<{ message: string }> {
    try {
      const apiKey = await this.apiCredentialsService.getApiKey(
        user.id,
        'openai'
      );
      if (!apiKey) {
        throw new HttpException(
          'OpenAI API key is required for summarization',
          HttpStatus.BAD_REQUEST
        );
      }

      await this.memoryService.summarizeMemories(agentId, user.id, apiKey);

      return { message: 'Memories summarized successfully' };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      const err = error as { message?: string };
      throw new HttpException(
        err.message || 'Unknown error',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
