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
  Request,
} from '@nestjs/common';
import { BotService } from './bot.service';
import { UserService } from '../user/user.service';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    imageUrl?: string | null;
  };
}

@Controller('api/bots')
export class BotController {
  constructor(
    private readonly botService: BotService,
    private readonly userService: UserService,
  ) {}

  private async ensureUser(req: AuthenticatedRequest) {
    if (!req.user?.id) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }
    // Sync user to DB
    await this.userService.findOrCreate({
      id: req.user.id,
      email: req.user.email || undefined,
      firstName: req.user.firstName || undefined,
      lastName: req.user.lastName || undefined,
      imageUrl: req.user.imageUrl || undefined,
    });
    return req.user.id;
  }

  @Get()
  async getAllBots(@Request() req: AuthenticatedRequest) {
    try {
      const userId = await this.ensureUser(req);
      return await this.botService.findAll(userId);
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
    @Request() req: AuthenticatedRequest,
  ) {
    try {
      const userId = await this.ensureUser(req);
      return await this.botService.findById(id, userId);
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
    @Body() body: { name: string; description?: string },
    @Request() req: AuthenticatedRequest,
  ) {
    try {
      const userId = await this.ensureUser(req);
      return await this.botService.create(userId, body.name, body.description);
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
    @Request() req: AuthenticatedRequest,
  ) {
    try {
      const userId = await this.ensureUser(req);
      return await this.botService.update(id, userId, body.name, body.description);
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
    @Request() req: AuthenticatedRequest,
  ) {
    try {
      const userId = await this.ensureUser(req);
      return await this.botService.getEmbeddings(id, userId);
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
    @Request() req: AuthenticatedRequest,
  ) {
    try {
      const userId = await this.ensureUser(req);
      await this.botService.deleteEmbedding(id, embeddingId, userId);
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
