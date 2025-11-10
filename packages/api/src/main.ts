import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { appConfig } from './config/app.config';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
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
      res: Response,
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
  app.use(json());

  // Global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // ClerkGuard is applied globally via APP_GUARD in AppModule
  // It enforces authentication for all routes except those marked with @Public()
  // It automatically syncs users to the database and attaches user info to requests

  await app.listen(appConfig.port);
  console.log(`Server running on http://localhost:${appConfig.port}`);
}

bootstrap();
