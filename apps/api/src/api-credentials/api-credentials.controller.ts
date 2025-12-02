import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
} from '@nestjs/common';
import { ApiCredentialsService } from './api-credentials.service';
import { User } from '../auth/decorators/user.decorator';
import { AuthenticatedUser } from '../common/types/auth.types';
import {
  SetApiKeyDto,
  ApiCredentialsStatusResponseDto,
  CheckApiKeyResponseDto,
} from '../common/dto/api-credentials.dto';
import { SuccessResponseDto } from '../common/dto/common.dto';
import { API_ROUTES } from '../common/constants/api-routes.constants.js';
import { MAGIC_STRINGS } from '../common/constants/error-messages.constants.js';

@Controller(API_ROUTES.API_CREDENTIALS.BASE)
export class ApiCredentialsController {
  constructor(private readonly apiCredentialsService: ApiCredentialsService) {}

  @Get('status')
  async getCredentialsStatus(
    @User() user: AuthenticatedUser
  ): Promise<ApiCredentialsStatusResponseDto> {
    const credentials = await this.apiCredentialsService.getCredentialsStatus(
      user.id
    );
    return { credentials };
  }

  @Post('openai')
  async setOpenAIKey(
    @User() user: AuthenticatedUser,
    @Body() body: SetApiKeyDto
  ): Promise<SuccessResponseDto> {
    await this.apiCredentialsService.setApiKey(
      user.id,
      MAGIC_STRINGS.OPENAI_PROVIDER,
      body.apiKey
    );
    return { success: true };
  }

  @Delete('openai')
  async deleteOpenAIKey(
    @User() user: AuthenticatedUser
  ): Promise<SuccessResponseDto> {
    await this.apiCredentialsService.deleteApiKey(
      user.id,
      MAGIC_STRINGS.OPENAI_PROVIDER
    );
    return { success: true };
  }

  @Get('openai/check')
  async checkOpenAIKey(
    @User() user: AuthenticatedUser
  ): Promise<CheckApiKeyResponseDto> {
    const hasKey = await this.apiCredentialsService.hasApiKey(
      user.id,
      MAGIC_STRINGS.OPENAI_PROVIDER
    );
    return { hasKey };
  }
}
