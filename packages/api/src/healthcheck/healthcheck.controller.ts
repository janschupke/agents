import { Controller, Get, HttpException, HttpStatus } from '@nestjs/common';
import { HealthcheckService } from './healthcheck.service';

@Controller('api/healthcheck')
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
      const err = error as { message?: string };
      throw new HttpException(
        err.message || 'Unknown error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
