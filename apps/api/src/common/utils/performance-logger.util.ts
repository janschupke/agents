import { Logger } from '@nestjs/common';

/**
 * Utility for performance logging
 * Provides consistent performance logging across services
 */
export class PerformanceLogger {
  /**
   * Log performance metrics for an operation
   * @param logger - NestJS Logger instance
   * @param operation - Name of the operation
   * @param durationMs - Duration in milliseconds
   * @param metadata - Optional metadata to include in log
   */
  static logPerformance(
    logger: Logger,
    operation: string,
    durationMs: number,
    metadata?: Record<string, unknown>
  ): void {
    const metadataStr = metadata ? ` ${JSON.stringify(metadata)}` : '';

    if (durationMs > 1000) {
      logger.warn(
        `[PERF] ${operation} took ${durationMs}ms (slow)${metadataStr}`
      );
    } else if (durationMs > 500) {
      logger.debug(`[PERF] ${operation} took ${durationMs}ms${metadataStr}`);
    } else {
      logger.debug(`[PERF] ${operation} took ${durationMs}ms${metadataStr}`);
    }
  }

  /**
   * Measure and log performance of an async operation
   * @param logger - NestJS Logger instance
   * @param operation - Name of the operation
   * @param fn - Async function to measure
   * @param metadata - Optional metadata to include in log
   * @returns Result of the function
   */
  static async measureAsync<T>(
    logger: Logger,
    operation: string,
    fn: () => Promise<T>,
    metadata?: Record<string, unknown>
  ): Promise<T> {
    const startTime = Date.now();
    try {
      const result = await fn();
      const durationMs = Date.now() - startTime;
      this.logPerformance(logger, operation, durationMs, metadata);
      return result;
    } catch (error) {
      const durationMs = Date.now() - startTime;
      this.logPerformance(logger, `${operation} (failed)`, durationMs, {
        ...metadata,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Measure and log performance of a sync operation
   * @param logger - NestJS Logger instance
   * @param operation - Name of the operation
   * @param fn - Function to measure
   * @param metadata - Optional metadata to include in log
   * @returns Result of the function
   */
  static measureSync<T>(
    logger: Logger,
    operation: string,
    fn: () => T,
    metadata?: Record<string, unknown>
  ): T {
    const startTime = Date.now();
    try {
      const result = fn();
      const durationMs = Date.now() - startTime;
      this.logPerformance(logger, operation, durationMs, metadata);
      return result;
    } catch (error) {
      const durationMs = Date.now() - startTime;
      this.logPerformance(logger, `${operation} (failed)`, durationMs, {
        ...metadata,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }
}
