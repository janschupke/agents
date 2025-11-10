import {
  Controller,
  Get,
  Put,
  Body,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { SystemConfigService } from './system-config.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { UseGuards } from '@nestjs/common';
import { RolesGuard } from '../auth/roles.guard';
import { SystemBehaviorRulesDto, UpdateSystemConfigDto } from '../common/dto/system-config.dto';

@Controller('api/system-config')
export class SystemConfigController {
  constructor(private readonly systemConfigService: SystemConfigService) {}

  @Get('behavior-rules')
  @Roles('admin')
  @UseGuards(RolesGuard)
  async getBehaviorRules(): Promise<SystemBehaviorRulesDto> {
    try {
      const rules = await this.systemConfigService.getBehaviorRules();
      return { rules };
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

  @Put('behavior-rules')
  @Roles('admin')
  @UseGuards(RolesGuard)
  async updateBehaviorRules(
    @Body() body: SystemBehaviorRulesDto
  ): Promise<SystemBehaviorRulesDto> {
    try {
      if (!Array.isArray(body.rules)) {
        throw new HttpException(
          'Rules must be an array',
          HttpStatus.BAD_REQUEST
        );
      }

      await this.systemConfigService.updateBehaviorRules(body.rules);
      return { rules: body.rules };
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

  @Get()
  @Roles('admin')
  @UseGuards(RolesGuard)
  async getAllConfigs(): Promise<UpdateSystemConfigDto> {
    try {
      const configs = await this.systemConfigService.getAllConfigs();
      return configs as UpdateSystemConfigDto;
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

  @Put()
  @Roles('admin')
  @UseGuards(RolesGuard)
  async updateConfigs(
    @Body() body: UpdateSystemConfigDto
  ): Promise<UpdateSystemConfigDto> {
    try {
      await this.systemConfigService.updateConfigs(body);
      return body;
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
