import 'reflect-metadata';
import { config } from 'dotenv';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

// Load environment variables
config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS
  app.enableCors();
  
  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`Server running on http://localhost:${port}`);
}

bootstrap();
