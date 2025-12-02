import { Test, TestingModule } from '@nestjs/testing';
import { AgentMemoryService } from './agent-memory.service';
import { AgentMemoryRepository } from './agent-memory.repository';
import { OpenAIService } from '../openai/openai.service';
import { MEMORY_CONFIG } from '../common/constants/api.constants.js';
import { NUMERIC_CONSTANTS } from '../common/constants/numeric.constants.js';
import OpenAI from 'openai';
import { AgentMemory } from '@prisma/client';

describe('AgentMemoryService', () => {
  let service: AgentMemoryService;
  let memoryRepository: jest.Mocked<AgentMemoryRepository>;
  let openaiService: jest.Mocked<OpenAIService>;

  const mockMemoryRepository = {
    create: jest.fn(),
    findForSummarization: jest.fn(),
    findSimilar: jest.fn(),
    getUpdateCount: jest.fn(),
    resetUpdateCount: jest.fn(),
    deleteMany: jest.fn(),
  };

  const mockOpenAIService = {
    getClient: jest.fn(),
    generateEmbedding: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AgentMemoryService,
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

    service = module.get<AgentMemoryService>(AgentMemoryService);
    memoryRepository = module.get(AgentMemoryRepository);
    openaiService = module.get(OpenAIService);

    jest.clearAllMocks();
  });

  describe('extractKeyInsights', () => {
    it('should return empty array for empty messages', async () => {
      const result = await service.extractKeyInsights([], 'api-key');
      expect(result).toEqual([]);
    });

    it('should extract insights from OpenAI response', async () => {
      const messages = [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there!' },
      ];
      const mockOpenAIClient = {
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue({
              choices: [
                {
                  message: {
                    content: 'User likes programming\nAssistant is helpful',
                  },
                },
              ],
            }),
          },
        },
      };

      openaiService.getClient.mockReturnValue(
        mockOpenAIClient as unknown as OpenAI
      );

      const result = await service.extractKeyInsights(messages, 'api-key');

      expect(result).toHaveLength(2);
      expect(result[0]).toBe('User likes programming');
      expect(result[1]).toBe('Assistant is helpful');
      expect(openaiService.getClient).toHaveBeenCalledWith('api-key');
    });

    it('should filter out numbered lines and bullets', async () => {
      const messages = [{ role: 'user', content: 'Test' }];
      const mockOpenAIClient = {
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue({
              choices: [
                {
                  message: {
                    content:
                      '1. First insight\n- Second insight\n* Third insight',
                  },
                },
              ],
            }),
          },
        },
      };

      openaiService.getClient.mockReturnValue(
        mockOpenAIClient as unknown as OpenAI
      );

      const result = await service.extractKeyInsights(messages, 'api-key');

      // Numbered lines are filtered out, only bullet points remain after processing
      expect(result).toHaveLength(2);
      expect(result[0]).toBe('Second insight');
      expect(result[1]).toBe('Third insight');
    });

    it('should limit insights to MAX_KEY_INSIGHTS_PER_UPDATE', async () => {
      const messages = [{ role: 'user', content: 'Test' }];
      const manyInsights = Array.from(
        { length: 10 },
        (_, i) => `Insight ${i + 1}`
      ).join('\n');
      const mockOpenAIClient = {
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue({
              choices: [
                {
                  message: {
                    content: manyInsights,
                  },
                },
              ],
            }),
          },
        },
      };

      openaiService.getClient.mockReturnValue(
        mockOpenAIClient as unknown as OpenAI
      );

      const result = await service.extractKeyInsights(messages, 'api-key');

      expect(result.length).toBeLessThanOrEqual(
        MEMORY_CONFIG.MAX_KEY_INSIGHTS_PER_UPDATE
      );
    });

    it('should return empty array on OpenAI error', async () => {
      const messages = [{ role: 'user', content: 'Test' }];
      const mockOpenAIClient = {
        chat: {
          completions: {
            create: jest.fn().mockRejectedValue(new Error('API Error')),
          },
        },
      };

      openaiService.getClient.mockReturnValue(
        mockOpenAIClient as unknown as OpenAI
      );

      const result = await service.extractKeyInsights(messages, 'api-key');

      expect(result).toEqual([]);
    });

    it('should return empty array when no response content', async () => {
      const messages = [{ role: 'user', content: 'Test' }];
      const mockOpenAIClient = {
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue({
              choices: [{ message: {} }],
            }),
          },
        },
      };

      openaiService.getClient.mockReturnValue(
        mockOpenAIClient as unknown as OpenAI
      );

      const result = await service.extractKeyInsights(messages, 'api-key');

      expect(result).toEqual([]);
    });
  });

  describe('createMemory', () => {
    it('should create memories for extracted insights', async () => {
      const agentId = 1;
      const userId = 'user-1';
      const sessionId = 1;
      const messages = [{ role: 'user', content: 'Test' }];
      const apiKey = 'api-key';
      const insights = ['Insight 1', 'Insight 2'];
      const embedding = new Array(NUMERIC_CONSTANTS.EMBEDDING_DIMENSIONS).fill(
        0.1
      );

      const mockOpenAIClient = {
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue({
              choices: [
                {
                  message: {
                    content: insights.join('\n'),
                  },
                },
              ],
            }),
          },
        },
      };

      openaiService.getClient.mockReturnValue(
        mockOpenAIClient as unknown as OpenAI
      );
      openaiService.generateEmbedding.mockResolvedValue(embedding);
      memoryRepository.create.mockResolvedValue({} as AgentMemory);

      await service.createMemory(
        agentId,
        userId,
        sessionId,
        'Session Name',
        messages,
        apiKey
      );

      expect(memoryRepository.create).toHaveBeenCalledTimes(2);
      expect(openaiService.generateEmbedding).toHaveBeenCalledTimes(2);
    });

    it('should skip memory creation if no insights extracted', async () => {
      const messages = [{ role: 'user', content: 'Test' }];
      const mockOpenAIClient = {
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue({
              choices: [{ message: {} }],
            }),
          },
        },
      };

      openaiService.getClient.mockReturnValue(
        mockOpenAIClient as unknown as OpenAI
      );

      await service.createMemory(1, 'user-1', 1, null, messages, 'api-key');

      expect(memoryRepository.create).not.toHaveBeenCalled();
    });

    it('should continue creating memories even if one fails', async () => {
      const messages = [{ role: 'user', content: 'Test' }];
      const insights = ['Insight 1', 'Insight 2'];
      const embedding = new Array(NUMERIC_CONSTANTS.EMBEDDING_DIMENSIONS).fill(
        0.1
      );

      const mockOpenAIClient = {
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue({
              choices: [
                {
                  message: {
                    content: insights.join('\n'),
                  },
                },
              ],
            }),
          },
        },
      };

      openaiService.getClient.mockReturnValue(
        mockOpenAIClient as unknown as OpenAI
      );
      openaiService.generateEmbedding
        .mockResolvedValueOnce(embedding)
        .mockRejectedValueOnce(new Error('Embedding error'));

      memoryRepository.create.mockResolvedValue({} as AgentMemory);

      await service.createMemory(1, 'user-1', 1, null, messages, 'api-key');

      expect(openaiService.generateEmbedding).toHaveBeenCalledTimes(2);
      expect(memoryRepository.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('shouldSummarize', () => {
    it('should return true when update count exceeds threshold', async () => {
      const updateCount = MEMORY_CONFIG.MEMORY_SUMMARIZATION_INTERVAL;
      memoryRepository.getUpdateCount.mockResolvedValue(updateCount);

      const result = await service.shouldSummarize(1, 'user-1');

      expect(result).toBe(true);
      expect(memoryRepository.getUpdateCount).toHaveBeenCalledWith(1, 'user-1');
    });

    it('should return false when update count is below threshold', async () => {
      const updateCount = MEMORY_CONFIG.MEMORY_SUMMARIZATION_INTERVAL - 1;
      memoryRepository.getUpdateCount.mockResolvedValue(updateCount);

      const result = await service.shouldSummarize(1, 'user-1');

      expect(result).toBe(false);
    });
  });

  describe('getMemoriesForContext', () => {
    it('should return formatted memories', async () => {
      const agentId = 1;
      const userId = 'user-1';
      const queryText = 'test query';
      const apiKey = 'api-key';
      const embedding = new Array(NUMERIC_CONSTANTS.EMBEDDING_DIMENSIONS).fill(
        0.1
      );
      const mockMemories = [
        {
          id: 1,
          agentId,
          userId,
          keyPoint: 'Memory 1',
          context: {},
          vectorEmbedding: null,
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date(),
          updateCount: 0,
        },
        {
          id: 2,
          agentId,
          userId,
          keyPoint: 'Memory 2',
          context: {},
          vectorEmbedding: null,
          createdAt: new Date('2024-02-20'),
          updatedAt: new Date(),
          updateCount: 0,
        },
      ];

      openaiService.generateEmbedding.mockResolvedValue(embedding);
      memoryRepository.findSimilar.mockResolvedValue(mockMemories);

      const result = await service.getMemoriesForContext(
        agentId,
        userId,
        queryText,
        apiKey
      );

      expect(result).toHaveLength(2);
      expect(result[0]).toContain('Memory 1');
      expect(result[1]).toContain('Memory 2');
      expect(openaiService.generateEmbedding).toHaveBeenCalledWith(
        queryText,
        apiKey
      );
      expect(memoryRepository.findSimilar).toHaveBeenCalledWith(
        embedding,
        agentId,
        userId,
        MEMORY_CONFIG.MAX_SIMILAR_MEMORIES,
        MEMORY_CONFIG.SIMILARITY_THRESHOLD
      );
    });

    it('should return empty array on error', async () => {
      openaiService.generateEmbedding.mockRejectedValue(new Error('API Error'));

      const result = await service.getMemoriesForContext(
        1,
        'user-1',
        'query',
        'api-key'
      );

      expect(result).toEqual([]);
    });
  });

  describe('summarizeMemories', () => {
    it('should return early if no memories to summarize', async () => {
      memoryRepository.findForSummarization.mockResolvedValue([]);

      await service.summarizeMemories(1, 'user-1', 'api-key');

      expect(memoryRepository.findForSummarization).toHaveBeenCalled();
      expect(memoryRepository.resetUpdateCount).not.toHaveBeenCalled();
    });

    it('should summarize and group similar memories', async () => {
      const agentId = 1;
      const userId = 'user-1';
      const apiKey = 'api-key';
      const embedding = new Array(NUMERIC_CONSTANTS.EMBEDDING_DIMENSIONS).fill(
        0.1
      );
      const similarEmbedding = embedding.map((v) => v + 0.01);

      const mockMemories = [
        {
          id: 1,
          agentId,
          userId,
          keyPoint: 'Memory 1',
          context: { sessionId: 1 },
          vectorEmbedding: embedding,
          createdAt: new Date(),
          updatedAt: new Date(),
          updateCount: 0,
        },
        {
          id: 2,
          agentId,
          userId,
          keyPoint: 'Memory 2',
          context: { sessionId: 1 },
          vectorEmbedding: similarEmbedding,
          createdAt: new Date(),
          updatedAt: new Date(),
          updateCount: 0,
        },
      ];

      const mockOpenAIClient = {
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue({
              choices: [
                {
                  message: {
                    content: 'Summarized memory',
                  },
                },
              ],
            }),
          },
        },
      };

      memoryRepository.findForSummarization.mockResolvedValue(mockMemories);
      openaiService.getClient.mockReturnValue(
        mockOpenAIClient as unknown as OpenAI
      );
      openaiService.generateEmbedding.mockResolvedValue(embedding);
      memoryRepository.create.mockResolvedValue({} as AgentMemory);
      memoryRepository.deleteMany.mockResolvedValue(undefined);
      memoryRepository.resetUpdateCount.mockResolvedValue(undefined);

      await service.summarizeMemories(agentId, userId, apiKey);

      expect(memoryRepository.findForSummarization).toHaveBeenCalled();
      expect(memoryRepository.resetUpdateCount).toHaveBeenCalledWith(
        agentId,
        userId
      );
    });

    it('should skip single memories in groups', async () => {
      // Create embeddings with low cosine similarity (opposite vectors)
      // [1, 0, 0, ...] and [0, 1, 0, ...] have cosine similarity of 0
      const embedding1 = new Array(NUMERIC_CONSTANTS.EMBEDDING_DIMENSIONS).fill(
        0
      );
      embedding1[0] = 1;
      const embedding2 = new Array(NUMERIC_CONSTANTS.EMBEDDING_DIMENSIONS).fill(
        0
      );
      embedding2[1] = 1;

      const mockMemories = [
        {
          id: 1,
          agentId: 1,
          userId: 'user-1',
          keyPoint: 'Memory 1',
          context: {},
          vectorEmbedding: embedding1,
          createdAt: new Date(),
          updatedAt: new Date(),
          updateCount: 0,
        },
        {
          id: 2,
          agentId: 1,
          userId: 'user-1',
          keyPoint: 'Memory 2',
          context: {},
          vectorEmbedding: embedding2,
          createdAt: new Date(),
          updatedAt: new Date(),
          updateCount: 0,
        },
      ];

      memoryRepository.findForSummarization.mockResolvedValue(mockMemories);
      memoryRepository.resetUpdateCount.mockResolvedValue(undefined);

      await service.summarizeMemories(1, 'user-1', 'api-key');

      // Should not create summaries for single memories (each memory is in its own group)
      expect(memoryRepository.create).not.toHaveBeenCalled();
      expect(memoryRepository.resetUpdateCount).toHaveBeenCalled();
    });
  });
});
