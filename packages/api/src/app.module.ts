import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { HealthcheckModule } from './healthcheck/healthcheck.module';
import { ChatModule } from './chat/chat.module';
import { BotModule } from './bot/bot.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { WebhookModule } from './webhook/webhook.module';
import { ApiCredentialsModule } from './api-credentials/api-credentials.module';
import { SystemConfigModule } from './system-config/system-config.module';
import { MessageTranslationModule } from './message-translation/message-translation.module';
import { ClerkGuard } from './auth/clerk.guard';

@Module({
  imports: [
    PrismaModule,
    HealthcheckModule,
    ChatModule,
    BotModule,
    AuthModule,
    UserModule,
    WebhookModule,
    ApiCredentialsModule,
    SystemConfigModule,
    MessageTranslationModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ClerkGuard,
    },
  ],
})
export class AppModule {}
