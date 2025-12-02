import {
  Controller,
  Post,
  Headers,
  Req,
  HttpCode,
  HttpStatus,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { Request } from 'express';
import { ClerkWebhookService } from './clerk-webhook.service';
import { Public } from '../auth/clerk.guard';
import { WebhookResponseDto } from '../common/dto/webhook.dto';
import { API_ROUTES } from '../common/constants/api-routes.constants.js';

@Controller(API_ROUTES.WEBHOOKS.CLERK)
@Public()
export class ClerkWebhookController {
  private readonly logger = new Logger(ClerkWebhookController.name);

  constructor(private readonly webhookService: ClerkWebhookService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Headers('svix-id') svixId: string | undefined,
    @Headers('svix-timestamp') svixTimestamp: string | undefined,
    @Headers('svix-signature') svixSignature: string | undefined,
    @Req() req: Request & { rawBody?: Buffer; body?: Buffer }
  ): Promise<WebhookResponseDto> {
    // Get raw body from middleware (stored in req.rawBody or req.body for webhook routes)
    const rawBody = req.rawBody || req.body;
    if (!rawBody || !Buffer.isBuffer(rawBody)) {
      this.logger.error('Raw body not available or invalid');
      throw new BadRequestException('Raw body not available or invalid');
    }

    await this.webhookService.handleWebhook({
      svixId: svixId || '',
      svixTimestamp: svixTimestamp || '',
      svixSignature: svixSignature || '',
      payload: rawBody,
    });
    return { received: true };
  }
}
