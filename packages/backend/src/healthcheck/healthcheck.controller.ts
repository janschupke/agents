import { Controller, Get } from '@nestjs/common';
import { HealthcheckService } from './healthcheck.service.js';

@Controller('api/healthcheck')
export class HealthcheckController {
  constructor(private readonly healthcheckService: HealthcheckService) {}

  @Get()
  async check() {
    return this.healthcheckService.check();
  }
}
