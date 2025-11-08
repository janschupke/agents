import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { HealthcheckModule } from './healthcheck/healthcheck.module';
import { ChatModule } from './chat/chat.module';

@Module({
  imports: [PrismaModule, HealthcheckModule, ChatModule],
})
export class AppModule {}
