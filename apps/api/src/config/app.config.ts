import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  cors: {
    enabled: true,
    origin: process.env.CORS_ORIGIN || '*',
  },
  database: {
    url: process.env.DATABASE_URL || '',
    directUrl: process.env.DIRECT_URL || '',
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
  },
  clerk: {
    secretKey: process.env.CLERK_SECRET_KEY || '',
    webhookSecret: process.env.CLERK_WEBHOOK_SECRET || '',
  },
  delay: {
    enabled: process.env.API_DELAY_ENABLED === 'true',
    ms: parseInt(process.env.API_DELAY_MS || '0', 10),
  },
  encryption: {
    key: process.env.ENCRYPTION_KEY || '',
  },
}));

// Legacy export for backward compatibility during migration
export const appConfig = {
  get port() {
    return parseInt(process.env.PORT || '3001', 10);
  },
  get nodeEnv() {
    return process.env.NODE_ENV || 'development';
  },
  cors: {
    enabled: true,
    get origin() {
      return process.env.CORS_ORIGIN || '*';
    },
  },
  database: {
    get url() {
      return process.env.DATABASE_URL || '';
    },
  },
  openai: {
    get apiKey() {
      return process.env.OPENAI_API_KEY || '';
    },
  },
  clerk: {
    get secretKey() {
      return process.env.CLERK_SECRET_KEY || '';
    },
    get webhookSecret() {
      return process.env.CLERK_WEBHOOK_SECRET || '';
    },
  },
  delay: {
    get enabled() {
      return process.env.API_DELAY_ENABLED === 'true';
    },
    get ms() {
      return parseInt(process.env.API_DELAY_MS || '0', 10);
    },
  },
} as const;
