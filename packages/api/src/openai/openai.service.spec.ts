import { Test, TestingModule } from '@nestjs/testing';
import { OpenAIService } from './openai.service';
import OpenAI from 'openai';

// Mock OpenAI
jest.mock('openai');

describe('OpenAIService', () => {
  let service: OpenAIService;
  let mockOpenAIClient: jest.Mocked<OpenAI>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OpenAIService],
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

    it('should return default client if API key not provided and OPENAI_API_KEY is set', () => {
      process.env.OPENAI_API_KEY = 'env-api-key';
      const serviceWithEnv = new OpenAIService();
      const client = serviceWithEnv.getClient();

      expect(client).toBeDefined();
    });

    it('should throw error if no API key provided and OPENAI_API_KEY is not set', () => {
      delete process.env.OPENAI_API_KEY;
      const serviceWithoutEnv = new OpenAIService();

      expect(() => serviceWithoutEnv.getClient()).toThrow(
        'No API key provided and OPENAI_API_KEY is not set in .env file',
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
      } as any;

      (OpenAI as jest.MockedClass<typeof OpenAI>).mockImplementation(() => mockOpenAIClient);

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

      mockOpenAIClient = {
        embeddings: {
          create: jest.fn().mockResolvedValue({
            data: [],
          }),
        },
      } as any;

      (OpenAI as jest.MockedClass<typeof OpenAI>).mockImplementation(() => mockOpenAIClient);

      await expect(service.generateEmbedding(text, apiKey)).rejects.toThrow(
        'No embedding returned from OpenAI',
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
      } as any;

      (OpenAI as jest.MockedClass<typeof OpenAI>).mockImplementation(() => mockOpenAIClient);

      await expect(service.generateEmbedding(text, apiKey)).rejects.toThrow(
        `Failed to generate embedding: ${errorMessage}`,
      );
    });

    it('should warn if embedding dimension is incorrect', async () => {
      const apiKey = 'test-api-key';
      const text = 'test text';
      const mockEmbedding = new Array(1000).fill(0.1); // Wrong dimension
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

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
      } as any;

      (OpenAI as jest.MockedClass<typeof OpenAI>).mockImplementation(() => mockOpenAIClient);

      const result = await service.generateEmbedding(text, apiKey);

      expect(result).toEqual(mockEmbedding);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Warning: Expected embedding dimension 1536, got 1000',
      );

      consoleSpy.mockRestore();
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
      ];

      const result = service.createMemoryChunkFromMessages(messages);

      expect(result).not.toContain('Message 1');
      expect(result).not.toContain('Message 2');
      expect(result).toContain('Message 3');
      expect(result).toContain('Message 4');
      expect(result).toContain('Message 5');
      expect(result).toContain('Message 6');
      expect(result).toContain('Message 7');
    });

    it('should handle empty messages array', () => {
      const messages: Array<{ role: string; content: string }> = [];

      const result = service.createMemoryChunkFromMessages(messages);

      expect(result).toBe('');
    });
  });
});
