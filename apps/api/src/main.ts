import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { appConfig } from './config/app.config';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { DelayInterceptor } from './common/interceptors/delay.interceptor';
import { json, raw } from 'express';
import { Request, Response, NextFunction } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
  });

  // Enable CORS with credentials support for Clerk
  app.enableCors({
    origin: appConfig.cors.origin,
    credentials: true,
  });

  // Handle raw body for webhook endpoints (must be before json parser)
  app.use(
    '/api/webhooks',
    raw({ type: 'application/json', limit: '1mb' }),
    (
      req: Request & { rawBody?: Buffer; body?: Buffer },
      _res: Response,
      next: NextFunction
    ) => {
      // Store raw body for webhook verification
      if (Buffer.isBuffer(req.body)) {
        req.rawBody = req.body;
      }
      next();
    }
  );
  // Handle JSON for all other endpoints
  // Increase limit to 10MB to support base64-encoded images (5MB image = ~6.67MB base64)
  app.use(json({ limit: '10mb' }));

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties that don't have decorators
      forbidNonWhitelisted: true, // Throw error if non-whitelisted properties are present
      transform: true, // Automatically transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: true, // Enable implicit type conversion
      },
    })
  );

  // Global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // Global delay interceptor (only works in dev mode)
  app.useGlobalInterceptors(new DelayInterceptor());

  // ClerkGuard is applied globally via APP_GUARD in AppModule
  // It enforces authentication for all routes except those marked with @Public()
  // It automatically syncs users to the database and attaches user info to requests

  await app.listen(appConfig.port);
  const logger = new Logger('Bootstrap');
  logger.log(`Server running on http://localhost:${appConfig.port}`);
}

bootstrap();
