import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { SystemConfigService } from './system-config.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import {
  SystemBehaviorRulesDto,
  UpdateSystemConfigDto,
} from '../common/dto/system-config.dto';
import { API_ROUTES } from '../common/constants/api-routes.constants.js';

@Controller(API_ROUTES.SYSTEM_CONFIG.BASE)
export class SystemConfigController {
  constructor(private readonly systemConfigService: SystemConfigService) {}

  @Get('behavior-rules')
  @Roles('admin')
  @UseGuards(RolesGuard)
  async getBehaviorRules(): Promise<SystemBehaviorRulesDto> {
    const rules = await this.systemConfigService.getBehaviorRules();
    return { rules };
  }

  @Put('behavior-rules')
  @Roles('admin')
  @UseGuards(RolesGuard)
  async updateBehaviorRules(
    @Body() body: SystemBehaviorRulesDto
  ): Promise<SystemBehaviorRulesDto> {
    await this.systemConfigService.updateBehaviorRules(body.rules);
    return { rules: body.rules };
  }

  @Get()
  @Roles('admin')
  @UseGuards(RolesGuard)
  async getAllConfigs(): Promise<UpdateSystemConfigDto> {
    const configs = await this.systemConfigService.getAllConfigs();
    return configs as UpdateSystemConfigDto;
  }

  @Put()
  @Roles('admin')
  @UseGuards(RolesGuard)
  async updateConfigs(
    @Body() body: UpdateSystemConfigDto
  ): Promise<UpdateSystemConfigDto> {
    await this.systemConfigService.updateConfigs(body);
    return body;
  }
}
