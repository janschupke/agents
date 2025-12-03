import { Controller, Get, Put, Body, UseGuards, Logger } from '@nestjs/common';
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
  private readonly logger = new Logger(SystemConfigController.name);

  constructor(private readonly systemConfigService: SystemConfigService) {}

  @Get('behavior-rules')
  @Roles('admin')
  @UseGuards(RolesGuard)
  async getBehaviorRules(): Promise<SystemBehaviorRulesDto> {
    this.logger.log('Getting system behavior rules');
    const rules = await this.systemConfigService.getBehaviorRules();
    return { rules };
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
    return { rules: body.rules };
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
}
