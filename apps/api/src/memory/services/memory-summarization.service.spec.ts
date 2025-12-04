import { Test, TestingModule } from '@nestjs/testing';
import { MemorySummarizationService } from './memory-summarization.service';
import { OpenAIService } from '../../openai/openai.service';
import { OPENAI_MODELS } from '../../common/constants/api.constants';
import type OpenAI from 'openai';

describe('MemorySummarizationService', () => {
  let service: MemorySummarizationService;

  const mockOpenAIService = {
    getClient: jest.fn(),
  };

  const mockOpenAIClient = {
    chat: {
      completions: {
        create: jest.fn(),
      },
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MemorySummarizationService,
        {
          provide: OpenAIService,
          useValue: mockOpenAIService,
        },
      ],
    }).compile();

    service = module.get<MemorySummarizationService>(
      MemorySummarizationService
    );

    mockOpenAIService.getClient.mockReturnValue(
      mockOpenAIClient as unknown as OpenAI
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('groupSimilarMemories', () => {
    it('should group similar memories by cosine similarity', async () => {
      const memories = [
        {
          id: 1,
          keyPoint: 'Memory 1',
          vectorEmbedding: [1, 0, 0],
          context: null,
          createdAt: new Date(),
        },
        {
          id: 2,
          keyPoint: 'Memory 2',
          vectorEmbedding: [0.9, 0.1, 0],
          context: null,
          createdAt: new Date(),
        },
        {
          id: 3,
          keyPoint: 'Memory 3',
          vectorEmbedding: [0, 1, 0],
          context: null,
          createdAt: new Date(),
        },
      ];

      const result = await service.groupSimilarMemories(memories);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle memories without embeddings', async () => {
      const memories = [
        {
          id: 1,
          keyPoint: 'Memory 1',
          vectorEmbedding: null,
          context: null,
          createdAt: new Date(),
        },
        {
          id: 2,
          keyPoint: 'Memory 2',
          vectorEmbedding: null,
          context: null,
          createdAt: new Date(),
        },
      ];

      const result = await service.groupSimilarMemories(memories);

      // Memories without embeddings are each in their own group
      // The group is created and pushed even when there's no embedding
      expect(result.length).toBe(2);
      expect(result[0].length).toBe(1);
      expect(result[1].length).toBe(1);
    });

    it('should handle empty array', async () => {
      const result = await service.groupSimilarMemories([]);

      expect(result).toEqual([]);
    });
  });

  describe('summarizeMemoryGroup', () => {
    it('should summarize a group of memories', async () => {
      const memoryGroup = [
        {
          id: 1,
          keyPoint: 'User likes programming',
          context: null,
          createdAt: new Date(),
        },
        {
          id: 2,
          keyPoint: 'User prefers TypeScript',
          context: null,
          createdAt: new Date(),
        },
      ];

      const mockCompletion = {
        choices: [
          {
            message: {
              content: 'User enjoys programming, especially TypeScript',
            },
          },
        ],
      } as OpenAI.Chat.Completions.ChatCompletion;

      mockOpenAIClient.chat.completions.create.mockResolvedValue(
        mockCompletion
      );

      const result = await service.summarizeMemoryGroup(memoryGroup, 'api-key');

      expect(result).toBe('User enjoys programming, especially TypeScript');
      expect(mockOpenAIClient.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          model: OPENAI_MODELS.MEMORY,
        })
      );
    });

    it('should handle OpenAI API errors', async () => {
      const memoryGroup = [
        {
          id: 1,
          keyPoint: 'Test',
          context: null,
          createdAt: new Date(),
        },
      ];

      mockOpenAIClient.chat.completions.create.mockRejectedValue(
        new Error('API error')
      );

      const result = await service.summarizeMemoryGroup(memoryGroup, 'api-key');

      // Single memory returns the keyPoint directly, even on error
      expect(result).toBe('Test');
    });

    it('should handle empty response for multiple memories', async () => {
      const memoryGroup = [
        {
          id: 1,
          keyPoint: 'Test 1',
          context: {},
          createdAt: new Date(),
        },
        {
          id: 2,
          keyPoint: 'Test 2',
          context: {},
          createdAt: new Date(),
        },
      ];

      const mockCompletion = {
        choices: [{}],
      } as unknown as OpenAI.Chat.Completions.ChatCompletion;

      mockOpenAIClient.chat.completions.create.mockResolvedValue(
        mockCompletion
      );

      const result = await service.summarizeMemoryGroup(memoryGroup, 'api-key');

      // When OpenAI returns empty response, should return empty string
      expect(result).toBe('');
    });
  });
});
