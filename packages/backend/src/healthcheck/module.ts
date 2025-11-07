import { Module } from '@nestjs/common';
import { HealthcheckController } from './controller/controller.js';
import { HealthcheckService } from './service/service.js';

@Module({
  controllers: [HealthcheckController],
  providers: [HealthcheckService],
})
export class HealthcheckModule {}
