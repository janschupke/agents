import { Injectable, Logger, LoggerService } from '@nestjs/common';

/**
 * Custom logger service that wraps NestJS Logger
 * Provides consistent logging interface across the application
 * All logs output to console
 */
@Injectable()
export class AppLogger implements LoggerService {
  private readonly logger: Logger;

  constructor(context?: string) {
    this.logger = new Logger(context || 'AppLogger');
  }

  log(message: string, context?: string): void {
    this.logger.log(message, context);
  }

  error(message: string, trace?: string, context?: string): void {
    this.logger.error(message, trace, context);
  }

  warn(message: string, context?: string): void {
    this.logger.warn(message, context);
  }

  debug(message: string, context?: string): void {
    this.logger.debug(message, context);
  }

  verbose(message: string, context?: string): void {
    this.logger.verbose(message, context);
  }
}
