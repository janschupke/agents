import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class HealthcheckService {
  constructor(private readonly prisma: PrismaService) {}

  async check() {
    try {
      // Test connection by querying bots table
      const bots = await this.prisma.bot.findMany({
        take: 10,
      });

      return {
        status: 'ok',
        message: 'Health check successful',
        bots: bots || [],
      };
    } catch (error) {
      const err = error as { message?: string; code?: string };
      throw new HttpException(
        err.message || 'Unknown error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
