import { Module } from '@nestjs/common';
import { HealthcheckController } from './healthcheck.controller.js';
import { HealthcheckService } from './healthcheck.service.js';

@Module({
  controllers: [HealthcheckController],
  providers: [HealthcheckService],
})
export class HealthcheckModule {}
