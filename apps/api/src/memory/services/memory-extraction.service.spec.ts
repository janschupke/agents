import { Test, TestingModule } from '@nestjs/testing';
import { MemoryExtractionService } from './memory-extraction.service';
import { OpenAIService } from '../../openai/openai.service';
import { AiRequestLogService } from '../../ai-request-log/ai-request-log.service';
import { OPENAI_MODELS } from '../../common/constants/api.constants';
import type OpenAI from 'openai';

describe('MemoryExtractionService', () => {
  let service: MemoryExtractionService;

  const mockOpenAIService = {
    getClient: jest.fn(),
  };

  const mockAiRequestLogService = {
    logRequest: jest.fn().mockResolvedValue(undefined),
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
        MemoryExtractionService,
        {
          provide: OpenAIService,
          useValue: mockOpenAIService,
        },
        {
          provide: AiRequestLogService,
          useValue: mockAiRequestLogService,
        },
      ],
    }).compile();

    service = module.get<MemoryExtractionService>(MemoryExtractionService);

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

  describe('extractKeyInsights', () => {
    it('should return empty array for empty messages', async () => {
      const result = await service.extractKeyInsights([], 'api-key');

      expect(result).toEqual([]);
      expect(mockOpenAIClient.chat.completions.create).not.toHaveBeenCalled();
    });

    it('should extract insights from messages', async () => {
      const messages = [
        { role: 'user', content: 'I love programming' },
        { role: 'assistant', content: 'That is great!' },
      ];

      const mockCompletion = {
        choices: [
          {
            message: {
              content:
                'User enjoys programming\nUser is interested in technology',
            },
          },
        ],
      } as OpenAI.Chat.Completions.ChatCompletion;

      mockOpenAIClient.chat.completions.create.mockResolvedValue(
        mockCompletion
      );

      const result = await service.extractKeyInsights(messages, 'api-key');

      expect(result.length).toBeGreaterThan(0);
      expect(mockOpenAIClient.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          model: OPENAI_MODELS.MEMORY,
        })
      );
    });

    it('should handle OpenAI API errors gracefully', async () => {
      const messages = [{ role: 'user', content: 'Test message' }];

      mockOpenAIClient.chat.completions.create.mockRejectedValue(
        new Error('API error')
      );

      const result = await service.extractKeyInsights(messages, 'api-key');

      expect(result).toEqual([]);
    });

    it('should filter and clean insights', async () => {
      const messages = [{ role: 'user', content: 'Test' }];

      const mockCompletion = {
        choices: [
          {
            message: {
              content: '1. First insight\n2. Second insight\n- Third insight',
            },
          },
        ],
      } as OpenAI.Chat.Completions.ChatCompletion;

      mockOpenAIClient.chat.completions.create.mockResolvedValue(
        mockCompletion
      );

      const result = await service.extractKeyInsights(messages, 'api-key');

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should limit insights to MAX_KEY_INSIGHTS_PER_UPDATE', async () => {
      const messages = [{ role: 'user', content: 'Test' }];

      const manyInsights = Array.from(
        { length: 10 },
        (_, i) => `Insight ${i}`
      ).join('\n');
      const mockCompletion = {
        choices: [
          {
            message: {
              content: manyInsights,
            },
          },
        ],
      } as OpenAI.Chat.Completions.ChatCompletion;

      mockOpenAIClient.chat.completions.create.mockResolvedValue(
        mockCompletion
      );

      const result = await service.extractKeyInsights(messages, 'api-key');

      expect(result.length).toBeLessThanOrEqual(3); // MAX_KEY_INSIGHTS_PER_UPDATE
    });
  });
});
