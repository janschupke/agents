import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  /**
   * Optimize connection string with pooling parameters for better performance
   */
  private static optimizeConnectionString(url: string): string {
    if (!url) return url;
    
    try {
      const urlObj = new URL(url);
      
      // Add connection pooling parameters if not already present
      const params = new URLSearchParams(urlObj.search);
      
      // Connection pool settings for pgbouncer
      if (!params.has('connection_limit')) {
        params.set('connection_limit', '10'); // Limit concurrent connections
      }
      if (!params.has('pool_timeout')) {
        params.set('pool_timeout', '10'); // Timeout for getting connection from pool
      }
      if (!params.has('connect_timeout')) {
        params.set('connect_timeout', '5'); // Connection timeout
      }
      
      urlObj.search = params.toString();
      return urlObj.toString();
    } catch (error) {
      // If URL parsing fails, return original
      console.warn('Failed to optimize connection string:', error);
      return url;
    }
  }

  constructor() {
    // Optimize connection string with pooling parameters
    const databaseUrl = process.env.DATABASE_URL || '';
    const optimizedUrl = PrismaService.optimizeConnectionString(databaseUrl);
    
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'info' },
        { emit: 'event', level: 'warn' },
      ],
      datasources: {
        db: {
          url: optimizedUrl,
        },
      },
    });

    // Log slow queries (>100ms)
    this.$on('query' as never, (e: any) => {
      const duration = e.duration || 0;
      if (duration > 100) {
        this.logger.warn(`[Performance] Slow query (${duration}ms): ${e.query.substring(0, 100)}...`);
      }
    });

    this.$on('error' as never, (e: any) => {
      this.logger.error('Prisma error:', e);
    });
  }

  async onModuleInit() {
    const connectStart = Date.now();
    await this.$connect();
    const connectTime = Date.now() - connectStart;
    if (connectTime > 100) {
      this.logger.warn(`[Performance] Prisma $connect took ${connectTime}ms`);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
