import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { APP_GUARD } from '@nestjs/core';
import request, { type Test as SuperTest } from 'supertest';
import { AppModule } from '../src/app.module';
import { OpenAIService } from '../src/openai/openai.service';
import { TestGuard } from './test-guard';
import { AuthenticatedUser } from '../src/common/types/auth.types';
import { PrismaService } from '../src/prisma/prisma.service';

/**
 * Mock OpenAI service that never makes real API calls
 */
export class MockOpenAIService {
  private readonly mockEmbedding = new Array(1536).fill(0.1);
  private readonly mockClient = {
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [
            {
              message: {
                content: 'Mocked OpenAI response',
              },
            },
          ],
          usage: {
            prompt_tokens: 10,
            completion_tokens: 20,
            total_tokens: 30,
          },
        }),
      },
    },
    embeddings: {
      create: jest.fn().mockResolvedValue({
        data: [
          {
            embedding: this.mockEmbedding,
          },
        ],
      }),
    },
  };

  getClient(_apiKey?: string): typeof this.mockClient {
    return this.mockClient;
  }

  async generateEmbedding(_text: string, _apiKey?: string): Promise<number[]> {
    return this.mockEmbedding;
  }

  createMemoryChunkFromMessages(
    messages: Array<{ role: string; content: string }>
  ): string {
    return messages.map((m) => `${m.role}: ${m.content}`).join('\n');
  }

  async createChatCompletion(
    _apiKey: string,
    _options: {
      model: string;
      systemMessage: string;
      userMessage: string;
      conversationHistory?: Array<{ role: string; content: string }>;
      temperature?: number;
      maxTokens?: number;
    }
  ): Promise<string> {
    return 'Mocked chat completion response';
  }

  // Expose mock for test customization
  getMockClient() {
    return this.mockClient;
  }
}

/**
 * Create a test NestJS application with mocked OpenAI and test guard
 */
export async function createTestApp(): Promise<INestApplication> {
  const mockOpenAIService = new MockOpenAIService();

  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(OpenAIService)
    .useValue(mockOpenAIService)
    .overrideProvider(APP_GUARD)
    .useClass(TestGuard)
    .compile();

  const app = moduleFixture.createNestApplication();

  // Apply same middleware as main.ts
  const { ValidationPipe } = await import('@nestjs/common');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    })
  );

  await app.init();

  return app;
}

/**
 * Get PrismaService from app for database operations
 */
export function getPrismaService(app: INestApplication): PrismaService {
  return app.get(PrismaService);
}

/**
 * Create authenticated request headers for testing
 */
export function createAuthHeaders(userId: string = 'test-user-123'): {
  Authorization: string;
} {
  // In integration tests, we'll bypass Clerk authentication
  // by using a test token that the test guard will accept
  return {
    Authorization: `Bearer test-token-${userId}`,
  };
}

/**
 * Create a test user object
 */
export function createTestUserObject(
  userId: string = 'test-user-123'
): AuthenticatedUser {
  return {
    id: userId,
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    imageUrl: null,
    roles: ['user'],
  };
}

/**
 * Helper to make authenticated requests
 * Usage: authenticatedRequest(app, userId).get('/path').expect(200)
 * 
 * This returns a request object that automatically adds auth headers to HTTP method calls
 */
export function authenticatedRequest(
  app: INestApplication,
  userId: string = 'test-user-123'
) {
  const authHeader = createAuthHeaders(userId).Authorization;
  const baseRequest = request(app.getHttpServer());
  
  // Create a wrapper object that proxies HTTP methods
  type HttpMethod = 'get' | 'post' | 'put' | 'delete' | 'patch' | 'head' | 'options';
  type RequestWrapper = {
    [K in HttpMethod]: (url: string, ...args: unknown[]) => SuperTest;
  };
  
  const wrapper = {} as RequestWrapper;
  
  // Proxy all HTTP methods
  (['get', 'post', 'put', 'delete', 'patch', 'head', 'options'] as HttpMethod[]).forEach(method => {
    wrapper[method] = function(url: string, ...args: unknown[]) {
      const test = (baseRequest[method] as (url: string, ...args: unknown[]) => SuperTest)(url, ...args);
      return test.set('Authorization', authHeader);
    };
  });
  
  return wrapper;
}
