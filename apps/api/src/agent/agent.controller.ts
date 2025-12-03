import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  Logger,
} from '@nestjs/common';
import { AgentService } from './agent.service';
import { User } from '../auth/decorators/user.decorator';
import { AuthenticatedUser } from '../common/types/auth.types';
import { CreateAgentDto, UpdateAgentDto } from '../common/dto/agent.dto';
import { SuccessResponseDto } from '../common/dto/common.dto';
import { AgentResponse } from '../common/interfaces/agent.interface';
import { API_ROUTES } from '../common/constants/api-routes.constants.js';
import { mapAgentConfigs } from '../common/utils/agent-config.util.js';

@Controller(API_ROUTES.AGENTS.BASE)
export class AgentController {
  private readonly logger = new Logger(AgentController.name);

  constructor(private readonly agentService: AgentService) {}

  @Get()
  async getAllAgents(
    @User() user: AuthenticatedUser
  ): Promise<AgentResponse[]> {
    this.logger.log(`Getting all agents for user ${user.id}`);
    // Exception filter will handle any errors
    return await this.agentService.findAll(user.id);
  }

  @Get(':id')
  async getAgent(
    @Param('id', ParseIntPipe) id: number,
    @User() user: AuthenticatedUser
  ): Promise<AgentResponse> {
    this.logger.log(`Getting agent ${id} for user ${user.id}`);
    return await this.agentService.findById(id, user.id);
  }

  @Post()
  async createAgent(
    @Body() body: CreateAgentDto,
    @User() user: AuthenticatedUser
  ): Promise<AgentResponse> {
    this.logger.log(`Creating agent "${body.name}" for user ${user.id}`);
    const configs = mapAgentConfigs(body.configs);
    return await this.agentService.create(
      user.id,
      body.name,
      body.description,
      body.avatarUrl,
      configs
    );
  }

  @Put(':id')
  async updateAgent(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateAgentDto,
    @User() user: AuthenticatedUser
  ): Promise<AgentResponse> {
    this.logger.log(`Updating agent ${id} for user ${user.id}`);
    const configs = mapAgentConfigs(body.configs);
    return await this.agentService.update(
      id,
      user.id,
      body.name,
      body.description,
      body.avatarUrl,
      configs
    );
  }

  @Delete(':id')
  async deleteAgent(
    @Param('id', ParseIntPipe) id: number,
    @User() user: AuthenticatedUser
  ): Promise<SuccessResponseDto> {
    this.logger.log(`Deleting agent ${id} for user ${user.id}`);
    await this.agentService.delete(id, user.id);
    return { success: true };
  }
}
