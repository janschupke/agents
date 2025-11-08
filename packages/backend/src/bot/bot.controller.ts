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

@Controller('api/bots')
export class BotController {
  constructor(private readonly botService: BotService) {}

  @Get()
  async getAllBots() {
    try {
      return await this.botService.findAll();
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
  async getBot(@Param('id', ParseIntPipe) id: number) {
    try {
      return await this.botService.findById(id);
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
  async createBot(@Body() body: { name: string; description?: string }) {
    try {
      return await this.botService.create(body.name, body.description);
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
    @Body() body: { name: string; description?: string },
  ) {
    try {
      return await this.botService.update(id, body.name, body.description);
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
  async getEmbeddings(@Param('id', ParseIntPipe) id: number) {
    try {
      return await this.botService.getEmbeddings(id);
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
  ) {
    try {
      await this.botService.deleteEmbedding(id, embeddingId);
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
