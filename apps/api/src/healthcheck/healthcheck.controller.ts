import { Controller, Get } from '@nestjs/common';
import { HealthcheckService } from './healthcheck.service';
import { Public } from '../auth/clerk.guard';
import { API_ROUTES } from '../common/constants/api-routes.constants.js';

@Controller(API_ROUTES.HEALTHCHECK.BASE)
@Public()
export class HealthcheckController {
  constructor(private readonly healthcheckService: HealthcheckService) {}

  @Get()
  async check() {
    return await this.healthcheckService.check();
  }
}
