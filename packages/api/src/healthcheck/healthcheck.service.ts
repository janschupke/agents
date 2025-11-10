import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HealthcheckService {
  constructor(private readonly prisma: PrismaService) {}

  async check() {
    try {
      // Test database connection with a simple query that doesn't access any data
      await this.prisma.$queryRaw`SELECT 1`;

      return {
        status: 'ok',
        message: 'Health check successful',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      const err = error as { message?: string; code?: string };
      throw new HttpException(
        {
          status: 'error',
          message: err.message || 'Database connection failed',
          timestamp: new Date().toISOString(),
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
