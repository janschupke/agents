import { Module } from '@nestjs/common';
import { HealthcheckModule } from './healthcheck/healthcheck.module.js';
import { ChatModule } from './chat/chat.module.js';

@Module({
  imports: [HealthcheckModule, ChatModule],
})
export class AppModule {}
