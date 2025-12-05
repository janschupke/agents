import { Test, TestingModule } from '@nestjs/testing';
import { HttpException } from '@nestjs/common';
import { OpenAIChatService } from './openai-chat.service';
import { OpenAIService } from '../../openai/openai.service';
import { AiRequestLogService } from '../../ai-request-log/ai-request-log.service';
import { MessageRole } from '@openai/shared-types';
import { OPENAI_MODELS } from '../../common/constants/api.constants';
import { NUMERIC_CONSTANTS } from '../../common/constants/numeric.constants';
import type OpenAI from 'openai';

describe('OpenAIChatService', () => {
  let service: OpenAIChatService;

  const mockOpenAIService = {
    getClient: jest.fn(),
  };

  const mockAiRequestLogService = {
    logRequest: jest.fn(),
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
        OpenAIChatService,
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

    service = module.get<OpenAIChatService>(OpenAIChatService);

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

  describe('createOpenAIRequest', () => {
    it('should create OpenAI request with correct structure', () => {
      const messages = [
        { role: MessageRole.SYSTEM, content: 'System message' },
        { role: MessageRole.USER, content: 'User message' },
      ];
      const agentConfig = {
        model: 'gpt-4o-mini',
        temperature: 0.7,
        max_tokens: 1000,
      };

      const result = service.createOpenAIRequest(messages, agentConfig);

      expect(result).toEqual({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'System message' },
          { role: 'user', content: 'User message' },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      });
    });

    it('should use default model if not provided', () => {
      const messages = [{ role: MessageRole.USER, content: 'Test' }];
      const agentConfig = {};

      const result = service.createOpenAIRequest(messages, agentConfig);

      expect(result.model).toBe(OPENAI_MODELS.DEFAULT);
    });

    it('should use default temperature if not provided', () => {
      const messages = [{ role: MessageRole.USER, content: 'Test' }];
      const agentConfig = {};

      const result = service.createOpenAIRequest(messages, agentConfig);

      expect(result.temperature).toBe(NUMERIC_CONSTANTS.DEFAULT_TEMPERATURE);
    });

    it('should handle undefined max_tokens', () => {
      const messages = [{ role: MessageRole.USER, content: 'Test' }];
      const agentConfig = {};

      const result = service.createOpenAIRequest(messages, agentConfig);

      expect(result.max_tokens).toBeUndefined();
    });
  });

  describe('createChatCompletion', () => {
    const mockRequest = {
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'System' },
        { role: 'user', content: 'User' },
      ],
      temperature: 0.7,
    };

    it('should successfully create chat completion', async () => {
      const mockCompletion = {
        choices: [
          {
            message: {
              content: 'Assistant response',
            },
          },
        ],
      } as OpenAI.Chat.Completions.ChatCompletion;

      mockOpenAIClient.chat.completions.create.mockResolvedValue(
        mockCompletion
      );
      mockAiRequestLogService.logRequest.mockResolvedValue(undefined);

      const result = await service.createChatCompletion(
        'api-key',
        mockRequest,
        'user-id'
      );

      expect(result.response).toBe('Assistant response');
      expect(result.completion).toBe(mockCompletion);
      expect(mockOpenAIClient.chat.completions.create).toHaveBeenCalledWith(
        mockRequest
      );
      expect(mockAiRequestLogService.logRequest).toHaveBeenCalled();
    });

    it('should throw error when no response from OpenAI', async () => {
      const mockCompletion = {
        choices: [{}],
      } as unknown as OpenAI.Chat.Completions.ChatCompletion;

      mockOpenAIClient.chat.completions.create.mockResolvedValue(
        mockCompletion
      );

      await expect(
        service.createChatCompletion('api-key', mockRequest, 'user-id')
      ).rejects.toThrow(HttpException);
    });

    it('should handle API key errors', async () => {
      const error = {
        message: 'Invalid API key',
        status: 401,
      };

      mockOpenAIClient.chat.completions.create.mockRejectedValue(error);

      await expect(
        service.createChatCompletion('api-key', mockRequest, 'user-id')
      ).rejects.toThrow(HttpException);
    });

    it('should log request when userId is provided', async () => {
      const mockCompletion = {
        choices: [
          {
            message: {
              content: 'Response',
            },
          },
        ],
      } as OpenAI.Chat.Completions.ChatCompletion;

      mockOpenAIClient.chat.completions.create.mockResolvedValue(
        mockCompletion
      );
      mockAiRequestLogService.logRequest.mockResolvedValue(undefined);

      await service.createChatCompletion('api-key', mockRequest, 'user-id');

      expect(mockAiRequestLogService.logRequest).toHaveBeenCalledWith(
        'user-id',
        expect.any(Object),
        mockCompletion,
        {
          agentId: undefined,
          logType: 'MESSAGE',
        }
      );
    });

    it('should not log request when userId is not provided', async () => {
      const mockCompletion = {
        choices: [
          {
            message: {
              content: 'Response',
            },
          },
        ],
      } as OpenAI.Chat.Completions.ChatCompletion;

      mockOpenAIClient.chat.completions.create.mockResolvedValue(
        mockCompletion
      );

      await service.createChatCompletion('api-key', mockRequest);

      expect(mockAiRequestLogService.logRequest).toHaveBeenCalled();
    });
  });
});
