import {
  Controller,
  Post,
  Headers,
  Req,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request } from 'express';
import { ClerkWebhookService } from './clerk-webhook.service';
import { Public } from '../auth/clerk.guard';
import { WebhookResponseDto } from '../common/dto/webhook.dto';

@Controller('api/webhooks/clerk')
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
    try {
      // Get raw body from middleware (stored in req.rawBody or req.body for webhook routes)
      const rawBody = req.rawBody || req.body;
      if (!rawBody || !Buffer.isBuffer(rawBody)) {
        throw new Error('Raw body not available or invalid');
      }

      await this.webhookService.handleWebhook({
        svixId: svixId || '',
        svixTimestamp: svixTimestamp || '',
        svixSignature: svixSignature || '',
        payload: rawBody,
      });
      return { received: true };
    } catch (error) {
      this.logger.error('Webhook handling failed:', error);
      throw error;
    }
  }
}
