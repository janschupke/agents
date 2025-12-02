import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { appConfig } from '../../config/app.config.js';

/**
 * Interceptor that adds an arbitrary delay to API responses for testing purposes.
 * Only works in development mode and never in production.
 *
 * Calculates how long the internal execution took and only delays until the set time.
 * For example, if delay is set to 1000ms and execution took 200ms, it will only delay 800ms more.
 */
@Injectable()
export class DelayInterceptor implements NestInterceptor {
  private readonly logger = new Logger(DelayInterceptor.name);

  intercept(_context: ExecutionContext, next: CallHandler): Observable<any> {
    // Only work in development mode, never in production
    if (appConfig.nodeEnv === 'production') {
      return next.handle();
    }

    // Check if delay is enabled
    if (!appConfig.delay.enabled || appConfig.delay.ms <= 0) {
      return next.handle();
    }

    const startTime = Date.now();
    const targetDelay = appConfig.delay.ms;

    return next.handle().pipe(
      switchMap((data) => {
        const executionTime = Date.now() - startTime;
        const remainingDelay = Math.max(0, targetDelay - executionTime);

        if (remainingDelay > 0) {
          this.logger.debug(
            `Adding ${remainingDelay}ms delay (execution took ${executionTime}ms, target: ${targetDelay}ms)`
          );
          // Return the data after the remaining delay
          return new Observable((subscriber) => {
            setTimeout(() => {
              subscriber.next(data);
              subscriber.complete();
            }, remainingDelay);
          });
        }

        // No delay needed, return data immediately
        return of(data);
      })
    );
  }
}
