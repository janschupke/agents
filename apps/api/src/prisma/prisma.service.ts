import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  /**
   * Optimize connection string for direct connection (port 5432)
   *
   * For direct connections (port 5432), we can use prepared statements and avoid
   * transaction overhead. This provides better performance than pooler connections.
   *
   * Prisma handles connection pooling internally, so we don't need external poolers
   * for regular queries when using direct connections.
   */
  private static optimizeConnectionString(
    url: string,
    isDirect: boolean = false
  ): string {
    if (!url) return url;

    try {
      const urlObj = new URL(url);
      const params = new URLSearchParams(urlObj.search);

      // For direct connections (port 5432), remove pgbouncer parameter
      // Direct connections support prepared statements and don't need transaction pooling
      if (isDirect || urlObj.port === '5432') {
        params.delete('pgbouncer');
        // Enable prepared statements for better performance
        // Prisma will use prepared statements automatically with direct connections
      } else if (urlObj.port === '6543' || urlObj.hostname.includes('pooler')) {
        // For pooler connections, keep pgbouncer=true to disable prepared statements
        if (!params.has('pgbouncer')) {
          params.set('pgbouncer', 'true');
        }
      }

      // Remove parameters that might interfere with Prisma's connection pooling
      params.delete('connection_limit');
      params.delete('pool_timeout');

      // Keep connect_timeout but make it reasonable (10 seconds)
      if (!params.has('connect_timeout')) {
        params.set('connect_timeout', '10');
      }

      // For direct connections, we can use statement caching
      if (isDirect || urlObj.port === '5432') {
        if (!params.has('statement_cache_size')) {
          params.set('statement_cache_size', '250');
        }
      } else {
        // Remove for pooler connections
        params.delete('statement_cache_size');
      }

      // Add application_name for monitoring
      if (!params.has('application_name')) {
        params.set('application_name', 'openai-api');
      }

      urlObj.search = params.toString();
      return urlObj.toString();
    } catch (error) {
      // If URL parsing fails, return original
      // Note: Can't use logger in static method, use console.warn instead
      console.warn('Failed to optimize connection string:', error);
      return url;
    }
  }

  constructor(configService: ConfigService) {
    // Prefer DIRECT_URL for regular queries (better performance, no transaction overhead)
    // Fall back to DATABASE_URL if DIRECT_URL is not set
    // Note: Access configService parameter directly (not via this) before super()
    const directUrl =
      configService.get<string>('app.database.directUrl') ||
      process.env.DIRECT_URL;
    const databaseUrl =
      configService.get<string>('app.database.url') ||
      process.env.DATABASE_URL ||
      '';

    // Use DIRECT_URL if available, otherwise use DATABASE_URL
    const connectionUrl = directUrl || databaseUrl;
    const isDirectConnection = !!directUrl;

    const optimizedUrl = PrismaService.optimizeConnectionString(
      connectionUrl,
      isDirectConnection
    );

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
      // Prisma handles connection pooling internally
      // With direct connections, we get better performance without transaction overhead
    });

    // Log connection type after super() call
    if (isDirectConnection) {
      this.logger.log(
        'Using DIRECT_URL for database connection (port 5432) - optimized for performance'
      );
    } else if (databaseUrl) {
      this.logger.warn(
        'Using DATABASE_URL (pooler). Consider using DIRECT_URL for better performance.'
      );
    }

    this.$on('error' as never, (e: { message?: string; target?: string }) => {
      this.logger.error('Prisma error:', e);
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
