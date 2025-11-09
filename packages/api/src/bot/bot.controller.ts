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

@Controller('api/bots')
export class BotController {
  constructor(private readonly botService: BotService) {}

  @Get()
  async getAllBots(@User() user: AuthenticatedUser) {
    try {
      return await this.botService.findAll(user.id);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      const err = error as { message?: string };
      throw new HttpException(
        err.message || 'Unknown error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  async getBot(
    @Param('id', ParseIntPipe) id: number,
    @User() user: AuthenticatedUser,
  ) {
    try {
      return await this.botService.findById(id, user.id);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      const err = error as { message?: string };
      throw new HttpException(
        err.message || 'Unknown error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post()
  async createBot(
    @Body() body: {
      name: string;
      description?: string;
      configs?: {
        temperature?: number;
        system_prompt?: string;
        behavior_rules?: string | unknown;
      };
    },
    @User() user: AuthenticatedUser,
  ) {
    try {
      // Prepare configs object if provided
      const configs: Record<string, unknown> | undefined = body.configs
        ? {
            temperature: body.configs.temperature,
            system_prompt: body.configs.system_prompt,
            behavior_rules: body.configs.behavior_rules,
          }
        : undefined;
      
      return await this.botService.create(user.id, body.name, body.description, configs);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      const err = error as { message?: string };
      throw new HttpException(
        err.message || 'Unknown error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put(':id')
  async updateBot(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: {
      name: string;
      description?: string;
      configs?: {
        temperature?: number;
        system_prompt?: string;
        behavior_rules?: string | unknown;
      };
    },
    @User() user: AuthenticatedUser,
  ) {
    try {
      // Prepare configs object if provided
      const configs: Record<string, unknown> | undefined = body.configs
        ? {
            temperature: body.configs.temperature,
            system_prompt: body.configs.system_prompt,
            behavior_rules: body.configs.behavior_rules,
          }
        : undefined;

      return await this.botService.update(
        id,
        user.id,
        body.name,
        body.description,
        configs,
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      const err = error as { message?: string };
      throw new HttpException(
        err.message || 'Unknown error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id/embeddings')
  async getEmbeddings(
    @Param('id', ParseIntPipe) id: number,
    @User() user: AuthenticatedUser,
  ) {
    try {
      return await this.botService.getEmbeddings(id, user.id);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      const err = error as { message?: string };
      throw new HttpException(
        err.message || 'Unknown error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':id/embeddings/:embeddingId')
  async deleteEmbedding(
    @Param('id', ParseIntPipe) id: number,
    @Param('embeddingId', ParseIntPipe) embeddingId: number,
    @User() user: AuthenticatedUser,
  ) {
    try {
      await this.botService.deleteEmbedding(id, embeddingId, user.id);
      return { success: true };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      const err = error as { message?: string };
      throw new HttpException(
        err.message || 'Unknown error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':id')
  async deleteBot(
    @Param('id', ParseIntPipe) id: number,
    @User() user: AuthenticatedUser,
  ) {
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
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
