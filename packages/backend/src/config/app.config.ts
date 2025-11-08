import { config } from 'dotenv';

config();

export const appConfig = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  cors: {
    enabled: true,
    origin: process.env.CORS_ORIGIN || '*',
  },
  database: {
    url: process.env.DATABASE_URL || '',
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
  },
  clerk: {
    secretKey: process.env.CLERK_SECRET_KEY || '',
    webhookSecret: process.env.CLERK_WEBHOOK_SECRET || '',
  },
} as const;
