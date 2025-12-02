import { Controller, Get, HttpException, HttpStatus } from '@nestjs/common';
import { HealthcheckService } from './healthcheck.service';
import { Public } from '../auth/clerk.guard';
import { API_ROUTES } from '../common/constants/api-routes.constants.js';

@Controller(API_ROUTES.HEALTHCHECK.BASE)
@Public()
export class HealthcheckController {
  constructor(private readonly healthcheckService: HealthcheckService) {}

  @Get()
  async check() {
    try {
      return await this.healthcheckService.check();
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error instanceof Error ? error.message : 'Unknown error',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
