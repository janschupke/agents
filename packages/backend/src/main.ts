import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { appConfig } from './config/app.config.js';
import { AllExceptionsFilter } from './common/filters/http-exception.filter.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS
  app.enableCors({
    origin: appConfig.cors.origin,
  });
  
  // Global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());
  
  await app.listen(appConfig.port);
  console.log(`Server running on http://localhost:${appConfig.port}`);
}

bootstrap();
