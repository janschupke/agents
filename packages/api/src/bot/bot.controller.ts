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
import { BotService } from './bot.service';
import { User } from '../auth/decorators/user.decorator';
import { AuthenticatedUser } from '../common/types/auth.types';
import { CreateBotDto, UpdateBotDto } from '../common/dto/bot.dto';
import { SuccessResponseDto } from '../common/dto/common.dto';
import { BotResponse } from '../common/interfaces/bot.interface';

@Controller('api/bots')
export class BotController {
  constructor(private readonly botService: BotService) {}

  @Get()
  async getAllBots(@User() user: AuthenticatedUser): Promise<BotResponse[]> {
    try {
      return await this.botService.findAll(user.id);
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
  async getBot(
    @Param('id', ParseIntPipe) id: number,
    @User() user: AuthenticatedUser
  ): Promise<BotResponse> {
    try {
      return await this.botService.findById(id, user.id);
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
  async createBot(
    @Body() body: CreateBotDto,
    @User() user: AuthenticatedUser
  ): Promise<BotResponse> {
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

      return await this.botService.create(
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
  async updateBot(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateBotDto,
    @User() user: AuthenticatedUser
  ): Promise<BotResponse> {
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

      return await this.botService.update(
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
  async deleteBot(
    @Param('id', ParseIntPipe) id: number,
    @User() user: AuthenticatedUser
  ): Promise<SuccessResponseDto> {
    try {
      await this.botService.delete(id, user.id);
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
