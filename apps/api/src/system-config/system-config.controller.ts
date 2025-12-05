import {
  Controller,
  Get,
  Put,
  Body,
  Param,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { SystemConfigService } from './system-config.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import {
  SystemBehaviorRulesDto,
  SystemBehaviorRulesByAgentTypeDto,
  UpdateSystemConfigDto,
} from '../common/dto/system-config.dto';
import { API_ROUTES } from '../common/constants/api-routes.constants.js';
import { AgentType } from '../common/enums/agent-type.enum';

@Controller(API_ROUTES.SYSTEM_CONFIG.BASE)
export class SystemConfigController {
  private readonly logger = new Logger(SystemConfigController.name);

  constructor(private readonly systemConfigService: SystemConfigService) {}

  @Get('behavior-rules')
  @Roles('admin')
  @UseGuards(RolesGuard)
  async getBehaviorRules(): Promise<SystemBehaviorRulesDto> {
    this.logger.log('Getting system behavior rules');
    const rules = await this.systemConfigService.getBehaviorRules();
    const systemPrompt = await this.systemConfigService.getSystemPrompt();
    return { rules, system_prompt: systemPrompt || undefined };
  }

  @Put('behavior-rules')
  @Roles('admin')
  @UseGuards(RolesGuard)
  async updateBehaviorRules(
    @Body() body: SystemBehaviorRulesDto
  ): Promise<SystemBehaviorRulesDto> {
    this.logger.log(
      `Updating system behavior rules (${body.rules.length} rules)`
    );
    await this.systemConfigService.updateBehaviorRules(body.rules);
    if (body.system_prompt !== undefined) {
      await this.systemConfigService.updateSystemPrompt(
        body.system_prompt || null
      );
    }
    const systemPrompt = await this.systemConfigService.getSystemPrompt();
    return {
      rules: body.rules,
      system_prompt: systemPrompt || undefined,
    };
  }

  @Get()
  @Roles('admin')
  @UseGuards(RolesGuard)
  async getAllConfigs(): Promise<UpdateSystemConfigDto> {
    this.logger.log('Getting all system configs');
    const configs = await this.systemConfigService.getAllConfigs();
    return configs as UpdateSystemConfigDto;
  }

  @Put()
  @Roles('admin')
  @UseGuards(RolesGuard)
  async updateConfigs(
    @Body() body: UpdateSystemConfigDto
  ): Promise<UpdateSystemConfigDto> {
    this.logger.log('Updating system configs');
    await this.systemConfigService.updateConfigs(body);
    return body;
  }

  @Get('system-prompt')
  @Roles('admin')
  @UseGuards(RolesGuard)
  async getSystemPrompt(): Promise<{ system_prompt?: string }> {
    this.logger.log('Getting system prompt (main)');
    const systemPrompt =
      await this.systemConfigService.getSystemPromptByAgentType(null);
    return { system_prompt: systemPrompt || undefined };
  }

  @Get('system-prompt/:agentType')
  @Roles('admin')
  @UseGuards(RolesGuard)
  async getSystemPromptByAgentType(
    @Param('agentType') agentTypeParam: string
  ): Promise<{ system_prompt?: string }> {
    const agentType =
      agentTypeParam === 'null' || agentTypeParam === 'main'
        ? null
        : (agentTypeParam.toUpperCase() as AgentType);
    this.logger.log(`Getting system prompt for agent type: ${agentType || 'main'}`);
    const systemPrompt =
      await this.systemConfigService.getSystemPromptByAgentType(agentType);
    return { system_prompt: systemPrompt || undefined };
  }

  @Put('system-prompt')
  @Roles('admin')
  @UseGuards(RolesGuard)
  async updateSystemPrompt(
    @Body() body: { system_prompt?: string; agent_type?: AgentType | null }
  ): Promise<{ system_prompt?: string }> {
    const agentType = body.agent_type ?? null;
    this.logger.log(
      `Updating system prompt for agent type: ${agentType || 'main'}`
    );
    await this.systemConfigService.updateSystemPromptByAgentType(
      agentType,
      body.system_prompt || ''
    );
    const systemPrompt =
      await this.systemConfigService.getSystemPromptByAgentType(agentType);
    return { system_prompt: systemPrompt || undefined };
  }

  @Put('system-prompt/:agentType')
  @Roles('admin')
  @UseGuards(RolesGuard)
  async updateSystemPromptByAgentType(
    @Param('agentType') agentTypeParam: string,
    @Body() body: { system_prompt?: string }
  ): Promise<{ system_prompt?: string }> {
    const agentType =
      agentTypeParam === 'null' || agentTypeParam === 'main'
        ? null
        : (agentTypeParam.toUpperCase() as AgentType);
    this.logger.log(
      `Updating system prompt for agent type: ${agentType || 'main'}`
    );
    await this.systemConfigService.updateSystemPromptByAgentType(
      agentType,
      body.system_prompt || ''
    );
    const systemPrompt =
      await this.systemConfigService.getSystemPromptByAgentType(agentType);
    return { system_prompt: systemPrompt || undefined };
  }

  @Get('behavior-rules/:agentType')
  @Roles('admin')
  @UseGuards(RolesGuard)
  async getBehaviorRulesByAgentType(
    @Param('agentType') agentTypeParam: string
  ): Promise<SystemBehaviorRulesDto> {
    const agentType =
      agentTypeParam === 'null' || agentTypeParam === 'main'
        ? null
        : (agentTypeParam.toUpperCase() as AgentType);
    this.logger.log(
      `Getting behavior rules for agent type: ${agentType || 'main'}`
    );
    const rules =
      await this.systemConfigService.getBehaviorRulesByAgentType(agentType);
    const systemPrompt =
      await this.systemConfigService.getSystemPromptByAgentType(agentType);
    return {
      rules,
      system_prompt: systemPrompt || undefined,
    };
  }

  @Put('behavior-rules/:agentType')
  @Roles('admin')
  @UseGuards(RolesGuard)
  async updateBehaviorRulesByAgentType(
    @Param('agentType') agentTypeParam: string,
    @Body() body: SystemBehaviorRulesByAgentTypeDto
  ): Promise<SystemBehaviorRulesDto> {
    const agentType =
      agentTypeParam === 'null' || agentTypeParam === 'main'
        ? null
        : (agentTypeParam.toUpperCase() as AgentType);
    this.logger.log(
      `Updating behavior rules for agent type: ${agentType || 'main'} (${body.rules.length} rules)`
    );
    await this.systemConfigService.updateBehaviorRulesByAgentType(
      agentType,
      body.rules
    );
    if (body.system_prompt !== undefined) {
      await this.systemConfigService.updateSystemPromptByAgentType(
        agentType,
        body.system_prompt || ''
      );
    }
    const systemPrompt =
      await this.systemConfigService.getSystemPromptByAgentType(agentType);
    return {
      rules: body.rules,
      system_prompt: systemPrompt || undefined,
    };
  }
}
