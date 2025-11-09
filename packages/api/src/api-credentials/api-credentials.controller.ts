import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ApiCredentialsService } from './api-credentials.service';
import { User } from '../auth/decorators/user.decorator';
import { AuthenticatedUser } from '../common/types/auth.types';
import { SetApiKeyDto, ApiCredentialsStatusResponseDto, CheckApiKeyResponseDto } from '../common/dto/api-credentials.dto';
import { SuccessResponseDto } from '../common/dto/common.dto';

@Controller('api/api-credentials')
export class ApiCredentialsController {
  constructor(private readonly apiCredentialsService: ApiCredentialsService) {}

  @Get('status')
  async getCredentialsStatus(@User() user: AuthenticatedUser): Promise<ApiCredentialsStatusResponseDto> {
    try {
      const credentials = await this.apiCredentialsService.getCredentialsStatus(user.id);
      return { credentials };
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
    @User() user: AuthenticatedUser,
    @Body() body: SetApiKeyDto,
  ): Promise<SuccessResponseDto> {
    if (!body.apiKey || typeof body.apiKey !== 'string') {
      throw new HttpException('API key is required', HttpStatus.BAD_REQUEST);
    }

    try {
      await this.apiCredentialsService.setApiKey(user.id, 'openai', body.apiKey);
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
  async deleteOpenAIKey(@User() user: AuthenticatedUser): Promise<SuccessResponseDto> {
    try {
      await this.apiCredentialsService.deleteApiKey(user.id, 'openai');
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
  async checkOpenAIKey(@User() user: AuthenticatedUser): Promise<CheckApiKeyResponseDto> {
    try {
      const hasKey = await this.apiCredentialsService.hasApiKey(user.id, 'openai');
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
