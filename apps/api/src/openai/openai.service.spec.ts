import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { OpenAIService } from './openai.service';
import OpenAI from 'openai';

// Mock OpenAI
jest.mock('openai');

describe('OpenAIService', () => {
  let service: OpenAIService;
  let mockOpenAIClient: {
    embeddings: {
      create: jest.Mock;
    };
  };

  beforeEach(async () => {
    const mockConfigService = {
      get: jest.fn((key: string) => {
        if (key === 'app.openai.apiKey') {
          return process.env.OPENAI_API_KEY || '';
        }
        return undefined;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OpenAIService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<OpenAIService>(OpenAIService);

    // Reset environment variables
    delete process.env.OPENAI_API_KEY;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getClient', () => {
    it('should return a client with provided API key', () => {
      const apiKey = 'test-api-key';
      const client = service.getClient(apiKey);

      expect(client).toBeDefined();
      expect(OpenAI).toHaveBeenCalledWith({ apiKey });
    });

    it('should return default client if API key not provided and OPENAI_API_KEY is set', async () => {
      const mockConfigServiceWithKey = {
        get: jest.fn((key: string) => {
          if (key === 'app.openai.apiKey') {
            return 'env-api-key';
          }
          return undefined;
        }),
      };

      const moduleWithKey = await Test.createTestingModule({
        providers: [
          OpenAIService,
          {
            provide: ConfigService,
            useValue: mockConfigServiceWithKey,
          },
        ],
      }).compile();

      const serviceWithEnv = moduleWithKey.get<OpenAIService>(OpenAIService);
      const client = serviceWithEnv.getClient();

      expect(client).toBeDefined();
    });

    it('should throw error if no API key provided and OPENAI_API_KEY is not set', () => {
      expect(() => service.getClient()).toThrow(
        'No API key provided and OPENAI_API_KEY is not set in .env file'
      );
    });
  });

  describe('generateEmbedding', () => {
    it('should generate an embedding', async () => {
      const apiKey = 'test-api-key';
      const text = 'test text';
      const mockEmbedding = new Array(1536).fill(0.1);

      mockOpenAIClient = {
        embeddings: {
          create: jest.fn().mockResolvedValue({
            data: [
              {
                embedding: mockEmbedding,
              },
            ],
          }),
        },
      } as {
        embeddings: {
          create: jest.Mock;
        };
      };

      (OpenAI as jest.MockedClass<typeof OpenAI>).mockImplementation(
        () => mockOpenAIClient as unknown as OpenAI
      );

      const result = await service.generateEmbedding(text, apiKey);

      expect(result).toEqual(mockEmbedding);
      expect(result.length).toBe(1536);
      expect(mockOpenAIClient.embeddings.create).toHaveBeenCalledWith({
        model: 'text-embedding-3-small',
        input: text,
        dimensions: 1536,
      });
    });

    it('should throw error if no embedding returned', async () => {
      const apiKey = 'test-api-key';
      const text = 'test text';

      const mockEmbeddings = {
        create: jest.fn().mockResolvedValue({
          data: [],
        }),
      };

      mockOpenAIClient = {
        embeddings: mockEmbeddings,
      };

      (OpenAI as jest.MockedClass<typeof OpenAI>).mockImplementation(
        () => mockOpenAIClient as unknown as OpenAI
      );

      await expect(service.generateEmbedding(text, apiKey)).rejects.toThrow(
        'No embedding returned from OpenAI'
      );
    });

    it('should handle API errors', async () => {
      const apiKey = 'test-api-key';
      const text = 'test text';
      const errorMessage = 'API error';

      mockOpenAIClient = {
        embeddings: {
          create: jest.fn().mockRejectedValue(new Error(errorMessage)),
        },
      } as {
        embeddings: {
          create: jest.Mock;
        };
      };

      (OpenAI as jest.MockedClass<typeof OpenAI>).mockImplementation(
        () => mockOpenAIClient as unknown as OpenAI
      );

      await expect(service.generateEmbedding(text, apiKey)).rejects.toThrow(
        `Failed to generate embedding: ${errorMessage}`
      );
    });

    it('should warn if embedding dimension is incorrect', async () => {
      const apiKey = 'test-api-key';
      const text = 'test text';
      const mockEmbedding = new Array(1000).fill(0.1); // Wrong dimension
      const loggerSpy = jest
        .spyOn(service['logger'], 'warn')
        .mockImplementation();

      mockOpenAIClient = {
        embeddings: {
          create: jest.fn().mockResolvedValue({
            data: [
              {
                embedding: mockEmbedding,
              },
            ],
          }),
        },
      } as {
        embeddings: {
          create: jest.Mock;
        };
      };

      (OpenAI as jest.MockedClass<typeof OpenAI>).mockImplementation(
        () => mockOpenAIClient as unknown as OpenAI
      );

      const result = await service.generateEmbedding(text, apiKey);

      expect(result).toEqual(mockEmbedding);
      expect(loggerSpy).toHaveBeenCalledWith(
        'Warning: Expected embedding dimension 1536, got 1000'
      );

      loggerSpy.mockRestore();
    });
  });

  describe('createMemoryChunkFromMessages', () => {
    it('should create memory chunk from messages', () => {
      const messages = [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there!' },
        { role: 'user', content: 'How are you?' },
        { role: 'assistant', content: 'I am doing well!' },
        { role: 'user', content: 'Great!' },
      ];

      const result = service.createMemoryChunkFromMessages(messages);

      expect(result).toContain('user: Hello');
      expect(result).toContain('assistant: Hi there!');
      expect(result).toContain('user: How are you?');
      expect(result).toContain('assistant: I am doing well!');
      expect(result).toContain('user: Great!');
    });

    it('should only use last 5 messages', () => {
      const messages = [
        { role: 'user', content: 'Message 1' },
        { role: 'user', content: 'Message 2' },
        { role: 'user', content: 'Message 3' },
        { role: 'user', content: 'Message 4' },
        { role: 'user', content: 'Message 5' },
        { role: 'user', content: 'Message 6' },
        { role: 'user', content: 'Message 7' },
        { role: 'user', content: 'Message 8' },
        { role: 'user', content: 'Message 9' },
        { role: 'user', content: 'Message 10' },
        { role: 'user', content: 'Message 11' },
        { role: 'user', content: 'Message 12' },
      ];

      const result = service.createMemoryChunkFromMessages(messages);

      // Should only contain last 5 messages (8-12), not first 7
      expect(result).not.toMatch(/\bMessage 1\b/);
      expect(result).not.toMatch(/\bMessage 2\b/);
      expect(result).not.toMatch(/\bMessage 3\b/);
      expect(result).not.toMatch(/\bMessage 4\b/);
      expect(result).not.toMatch(/\bMessage 5\b/);
      expect(result).not.toMatch(/\bMessage 6\b/);
      expect(result).not.toMatch(/\bMessage 7\b/);
      expect(result).toContain('Message 8');
      expect(result).toContain('Message 9');
      expect(result).toContain('Message 10');
      expect(result).toContain('Message 11');
      expect(result).toContain('Message 12');

      // Verify it contains exactly 5 messages
      const messageCount = (result.match(/Message \d+/g) || []).length;
      expect(messageCount).toBe(5);
    });

    it('should handle empty messages array', () => {
      const messages: Array<{ role: string; content: string }> = [];

      const result = service.createMemoryChunkFromMessages(messages);

      expect(result).toBe('');
    });
  });
});
