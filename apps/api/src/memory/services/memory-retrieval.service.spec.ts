import { Test, TestingModule } from '@nestjs/testing';
import { MemoryRetrievalService } from './memory-retrieval.service';
import { AgentMemoryRepository } from '../agent-memory.repository';
import { OpenAIService } from '../../openai/openai.service';
import { MEMORY_CONFIG } from '../../common/constants/api.constants';

describe('MemoryRetrievalService', () => {
  let service: MemoryRetrievalService;

  const mockMemoryRepository = {
    findSimilar: jest.fn(),
  };

  const mockOpenAIService = {
    generateEmbedding: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MemoryRetrievalService,
        {
          provide: AgentMemoryRepository,
          useValue: mockMemoryRepository,
        },
        {
          provide: OpenAIService,
          useValue: mockOpenAIService,
        },
      ],
    }).compile();

    service = module.get<MemoryRetrievalService>(MemoryRetrievalService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getMemoriesForContext', () => {
    it('should retrieve and format memories for context', async () => {
      const mockEmbedding = [0.1, 0.2, 0.3];
      const mockMemories = [
        {
          id: 1,
          keyPoint: 'User likes programming',
          createdAt: new Date('2024-01-01'),
          vectorEmbedding: null,
          context: null,
        },
        {
          id: 2,
          keyPoint: 'User prefers TypeScript',
          createdAt: new Date('2024-01-02'),
          vectorEmbedding: null,
          context: null,
        },
      ];

      mockOpenAIService.generateEmbedding.mockResolvedValue(mockEmbedding);
      mockMemoryRepository.findSimilar.mockResolvedValue(mockMemories);

      const result = await service.getMemoriesForContext(
        1,
        'user-id',
        'What does the user like?',
        'api-key'
      );

      expect(result).toBeDefined();
      expect(result.length).toBe(2);
      expect(result[0]).toContain('User likes programming');
      expect(mockOpenAIService.generateEmbedding).toHaveBeenCalledWith(
        'What does the user like?',
        'api-key'
      );
      expect(mockMemoryRepository.findSimilar).toHaveBeenCalledWith(
        mockEmbedding,
        1,
        'user-id',
        MEMORY_CONFIG.MAX_SIMILAR_MEMORIES,
        MEMORY_CONFIG.SIMILARITY_THRESHOLD
      );
    });

    it('should return empty array on error', async () => {
      mockOpenAIService.generateEmbedding.mockRejectedValue(
        new Error('API error')
      );

      const result = await service.getMemoriesForContext(
        1,
        'user-id',
        'query',
        'api-key'
      );

      expect(result).toEqual([]);
    });

    it('should format memories with dates', async () => {
      const mockEmbedding = [0.1, 0.2, 0.3];
      const mockMemories = [
        {
          id: 1,
          keyPoint: 'Test memory',
          createdAt: new Date('2024-01-15'),
          vectorEmbedding: null,
          context: null,
        },
      ];

      mockOpenAIService.generateEmbedding.mockResolvedValue(mockEmbedding);
      mockMemoryRepository.findSimilar.mockResolvedValue(mockMemories);

      const result = await service.getMemoriesForContext(
        1,
        'user-id',
        'query',
        'api-key'
      );

      expect(result[0]).toContain('Jan 15, 2024');
      expect(result[0]).toContain('Test memory');
    });

    it('should handle empty results', async () => {
      const mockEmbedding = [0.1, 0.2, 0.3];

      mockOpenAIService.generateEmbedding.mockResolvedValue(mockEmbedding);
      mockMemoryRepository.findSimilar.mockResolvedValue([]);

      const result = await service.getMemoriesForContext(
        1,
        'user-id',
        'query',
        'api-key'
      );

      expect(result).toEqual([]);
    });
  });
});
