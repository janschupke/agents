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
  UseGuards,
} from '@nestjs/common';
import { AgentArchetypeService } from './agent-archetype.service';
import {
  CreateAgentArchetypeDto,
  UpdateAgentArchetypeDto,
  AgentArchetypeResponse,
} from '../common/dto/agent-archetype.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { API_ROUTES } from '../common/constants/api-routes.constants';

@Controller(API_ROUTES.AGENT_ARCHETYPES.BASE)
export class AgentArchetypeController {
  private readonly logger = new Logger(AgentArchetypeController.name);

  constructor(private readonly archetypeService: AgentArchetypeService) {}

  @Get()
  async getAllArchetypes(): Promise<AgentArchetypeResponse[]> {
    this.logger.log('Fetching all agent archetypes');
    return await this.archetypeService.findAll();
  }

  @Get(':id')
  async getArchetype(
    @Param('id', ParseIntPipe) id: number
  ): Promise<AgentArchetypeResponse> {
    this.logger.log(`Fetching agent archetype ${id}`);
    return await this.archetypeService.findById(id);
  }

  @Post()
  @Roles('admin')
  @UseGuards(RolesGuard)
  async createArchetype(
    @Body() body: CreateAgentArchetypeDto
  ): Promise<AgentArchetypeResponse> {
    this.logger.log(`Creating agent archetype "${body.name}"`);
    return await this.archetypeService.create(body);
  }

  @Put(':id')
  @Roles('admin')
  @UseGuards(RolesGuard)
  async updateArchetype(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateAgentArchetypeDto
  ): Promise<AgentArchetypeResponse> {
    this.logger.log(`Updating agent archetype ${id}`);
    return await this.archetypeService.update(id, body);
  }

  @Delete(':id')
  @Roles('admin')
  @UseGuards(RolesGuard)
  async deleteArchetype(@Param('id', ParseIntPipe) id: number): Promise<void> {
    this.logger.log(`Deleting agent archetype ${id}`);
    await this.archetypeService.delete(id);
  }
}
