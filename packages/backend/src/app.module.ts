import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { HealthcheckModule } from './healthcheck/healthcheck.module';
import { ChatModule } from './chat/chat.module';
import { BotModule } from './bot/bot.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { WebhookModule } from './webhook/webhook.module';
import { ClerkGuard } from './auth/clerk.guard';

@Module({
  imports: [PrismaModule, HealthcheckModule, ChatModule, BotModule, AuthModule, UserModule, WebhookModule],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ClerkGuard,
    },
  ],
})
export class AppModule {}
