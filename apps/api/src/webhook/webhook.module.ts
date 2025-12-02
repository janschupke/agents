import { Module } from '@nestjs/common';
import { ClerkWebhookController } from './clerk-webhook.controller';
import { ClerkWebhookService } from './clerk-webhook.service';
import { UserModule } from '../user/user.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [UserModule, AuthModule],
  controllers: [ClerkWebhookController],
  providers: [ClerkWebhookService],
  exports: [ClerkWebhookService],
})
export class WebhookModule {}
