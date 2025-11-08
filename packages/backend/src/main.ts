import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { appConfig } from './config/app.config';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS with credentials support for Clerk
  app.enableCors({
    origin: appConfig.cors.origin,
    credentials: true,
  });
  
  // Global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());
  
  // ClerkGuard is applied globally via APP_GUARD in AppModule
  // It allows requests without tokens, but sets req.user when token is valid
  
  await app.listen(appConfig.port);
  console.log(`Server running on http://localhost:${appConfig.port}`);
}

bootstrap();
