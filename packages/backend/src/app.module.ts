import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module.js';
import { HealthcheckModule } from './healthcheck/module.js';
import { ChatModule } from './chat/module.js';

@Module({
  imports: [PrismaModule, HealthcheckModule, ChatModule],
})
export class AppModule {}
