import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Request,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ApiCredentialsService } from './api-credentials.service';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    imageUrl?: string | null;
    roles?: string[];
  };
}

@Controller('api/api-credentials')
export class ApiCredentialsController {
  constructor(private readonly apiCredentialsService: ApiCredentialsService) {}

  @Get('status')
  async getCredentialsStatus(@Request() req: AuthenticatedRequest) {
    if (!req.user?.id) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    try {
      return await this.apiCredentialsService.getCredentialsStatus(req.user.id);
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

  @Post('openai')
  async setOpenAIKey(
    @Request() req: AuthenticatedRequest,
    @Body() body: { apiKey: string },
  ) {
    if (!req.user?.id) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    if (!body.apiKey || typeof body.apiKey !== 'string') {
      throw new HttpException('API key is required', HttpStatus.BAD_REQUEST);
    }

    try {
      await this.apiCredentialsService.setApiKey(req.user.id, 'openai', body.apiKey);
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

  @Delete('openai')
  async deleteOpenAIKey(@Request() req: AuthenticatedRequest) {
    if (!req.user?.id) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    try {
      await this.apiCredentialsService.deleteApiKey(req.user.id, 'openai');
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

  @Get('openai/check')
  async checkOpenAIKey(@Request() req: AuthenticatedRequest) {
    if (!req.user?.id) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    try {
      const hasKey = await this.apiCredentialsService.hasApiKey(req.user.id, 'openai');
      return { hasKey };
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
