import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { AgentService } from './agent.service';
import { User } from '../auth/decorators/user.decorator';
import { AuthenticatedUser } from '../common/types/auth.types';
import { CreateAgentDto, UpdateAgentDto } from '../common/dto/agent.dto';
import { SuccessResponseDto } from '../common/dto/common.dto';
import { AgentResponse } from '../common/interfaces/agent.interface';
import { API_ROUTES } from '../common/constants/api-routes.constants.js';

@Controller(API_ROUTES.AGENTS.BASE)
export class AgentController {
  constructor(private readonly agentService: AgentService) {}

  @Get()
  async getAllAgents(@User() user: AuthenticatedUser): Promise<AgentResponse[]> {
    try {
      return await this.agentService.findAll(user.id);
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

  @Get(':id')
  async getAgent(
    @Param('id', ParseIntPipe) id: number,
    @User() user: AuthenticatedUser
  ): Promise<AgentResponse> {
    try {
      return await this.agentService.findById(id, user.id);
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

  @Post()
  async createAgent(
    @Body() body: CreateAgentDto,
    @User() user: AuthenticatedUser
  ): Promise<AgentResponse> {
    try {
      // Prepare configs object if provided
      const configs: Record<string, unknown> | undefined = body.configs
        ? {
            temperature: body.configs.temperature,
            system_prompt: body.configs.system_prompt,
            behavior_rules: body.configs.behavior_rules,
            model: body.configs.model,
            max_tokens: body.configs.max_tokens,
          }
        : undefined;

      return await this.agentService.create(
        user.id,
        body.name,
        body.description,
        body.avatarUrl,
        configs
      );
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

  @Put(':id')
  async updateAgent(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateAgentDto,
    @User() user: AuthenticatedUser
  ): Promise<AgentResponse> {
    try {
      // Prepare configs object if provided
      const configs: Record<string, unknown> | undefined = body.configs
        ? {
            temperature: body.configs.temperature,
            system_prompt: body.configs.system_prompt,
            behavior_rules: body.configs.behavior_rules,
            model: body.configs.model,
            max_tokens: body.configs.max_tokens,
          }
        : undefined;

      return await this.agentService.update(
        id,
        user.id,
        body.name,
        body.description,
        body.avatarUrl,
        configs
      );
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

  @Delete(':id')
  async deleteAgent(
    @Param('id', ParseIntPipe) id: number,
    @User() user: AuthenticatedUser
  ): Promise<SuccessResponseDto> {
    try {
      await this.agentService.delete(id, user.id);
      return { success: true };
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
