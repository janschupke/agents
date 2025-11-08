import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { HealthcheckModule } from './healthcheck/healthcheck.module';
import { ChatModule } from './chat/chat.module';
import { BotModule } from './bot/bot.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [PrismaModule, HealthcheckModule, ChatModule, BotModule, AuthModule, UserModule],
})
export class AppModule {}
