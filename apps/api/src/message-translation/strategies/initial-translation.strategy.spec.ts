import { Test, TestingModule } from '@nestjs/testing';
import { HttpException } from '@nestjs/common';
import { InitialTranslationStrategy } from './initial-translation.strategy';
import { OpenAIService } from '../../openai/openai.service';
import { MessageWordTranslationRepository } from '../message-word-translation.repository';
import { MessageTranslationRepository } from '../message-translation.repository';
import { TranslationContext } from '../translation-strategy.interface';
import { MessageRole } from '../../common/enums/message-role.enum';
import OpenAI from 'openai';

describe('InitialTranslationStrategy', () => {
  let strategy: InitialTranslationStrategy;
  let openaiService: jest.Mocked<OpenAIService>;
  let wordTranslationRepository: jest.Mocked<MessageWordTranslationRepository>;
  let translationRepository: jest.Mocked<MessageTranslationRepository>;

  const mockOpenAIService = {
    getClient: jest.fn(),
  };

  const mockWordTranslationRepository = {
    deleteByMessageId: jest.fn(),
    createMany: jest.fn(),
  };

  const mockTranslationRepository = {
    create: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InitialTranslationStrategy,
        {
          provide: OpenAIService,
          useValue: mockOpenAIService,
        },
        {
          provide: MessageWordTranslationRepository,
          useValue: mockWordTranslationRepository,
        },
        {
          provide: MessageTranslationRepository,
          useValue: mockTranslationRepository,
        },
      ],
    }).compile();

    strategy = module.get<InitialTranslationStrategy>(
      InitialTranslationStrategy
    );
    openaiService = module.get(OpenAIService);
    wordTranslationRepository = module.get(MessageWordTranslationRepository);
    translationRepository = module.get(MessageTranslationRepository);

    jest.clearAllMocks();
  });

  describe('translateMessageWithWords', () => {
    const messageId = 1;
    const messageContent = '你好，世界！';
    const apiKey = 'test-api-key';
    const conversationHistory = [
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi there!' },
    ];
    const context: TranslationContext = {
      conversationHistory,
      messageRole: MessageRole.ASSISTANT,
    };

    it('should translate message with conversation context', async () => {
      const mockWordTranslations = [
        { originalWord: '你好', translation: 'hello' },
        { originalWord: '世界', translation: 'world' },
      ];
      const fullTranslation = 'Hello, world!';

      const mockOpenAIClient = {
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue({
              choices: [
                {
                  message: {
                    content: JSON.stringify({
                      words: mockWordTranslations,
                      fullTranslation,
                    }),
                  },
                },
              ],
            }),
          },
        },
      } as unknown as OpenAI;

      openaiService.getClient.mockReturnValue(mockOpenAIClient);
      wordTranslationRepository.deleteByMessageId.mockResolvedValue(undefined);
      wordTranslationRepository.createMany.mockResolvedValue({ count: 2 });
      translationRepository.create.mockResolvedValue({
        id: 1,
        messageId,
        translation: fullTranslation,
        createdAt: new Date(),
      });

      const result = await strategy.translateMessageWithWords(
        messageId,
        messageContent,
        apiKey,
        context
      );

      expect(result).toEqual({
        translation: fullTranslation,
        wordTranslations: mockWordTranslations,
      });

      expect(openaiService.getClient).toHaveBeenCalledWith(apiKey);
      expect(mockOpenAIClient.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          model: expect.any(String),
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'system',
            }),
            expect.objectContaining({
              role: 'user',
              content: expect.stringContaining(messageContent),
            }),
          ]),
          response_format: { type: 'json_object' },
        })
      );

      // Verify prompt includes conversation context
      const createCall = mockOpenAIClient.chat.completions.create as jest.Mock;
      const userMessage = createCall.mock.calls[0][0].messages.find(
        (m: { role: string }) => m.role === 'user'
      );
      expect(userMessage.content).toContain('Previous conversation');
      expect(userMessage.content).toContain('Hello');
      expect(userMessage.content).toContain('Hi there!');

      expect(wordTranslationRepository.deleteByMessageId).toHaveBeenCalledWith(
        messageId
      );
      expect(wordTranslationRepository.createMany).toHaveBeenCalled();
      expect(translationRepository.create).toHaveBeenCalledWith(
        messageId,
        fullTranslation
      );
    });

    it('should translate message without conversation context', async () => {
      const mockWordTranslations = [
        { originalWord: '你好', translation: 'hello' },
      ];
      const fullTranslation = 'Hello';

      const mockOpenAIClient = {
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue({
              choices: [
                {
                  message: {
                    content: JSON.stringify({
                      words: mockWordTranslations,
                      fullTranslation,
                    }),
                  },
                },
              ],
            }),
          },
        },
      } as unknown as OpenAI;

      openaiService.getClient.mockReturnValue(mockOpenAIClient);
      wordTranslationRepository.deleteByMessageId.mockResolvedValue(undefined);
      wordTranslationRepository.createMany.mockResolvedValue({ count: 2 });
      translationRepository.create.mockResolvedValue({
        id: 1,
        messageId,
        translation: fullTranslation,
        createdAt: new Date(),
      });

      const result = await strategy.translateMessageWithWords(
        messageId,
        messageContent,
        apiKey,
        { messageRole: MessageRole.ASSISTANT }
      );

      expect(result).toEqual({
        translation: fullTranslation,
        wordTranslations: mockWordTranslations,
      });
    });

    it('should throw error if OpenAI returns no response', async () => {
      const mockOpenAIClient = {
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue({
              choices: [
                {
                  message: {
                    content: null,
                  },
                },
              ],
            }),
          },
        },
      } as unknown as OpenAI;

      openaiService.getClient.mockReturnValue(mockOpenAIClient);

      await expect(
        strategy.translateMessageWithWords(
          messageId,
          messageContent,
          apiKey,
          context
        )
      ).rejects.toThrow(HttpException);
      await expect(
        strategy.translateMessageWithWords(
          messageId,
          messageContent,
          apiKey,
          context
        )
      ).rejects.toThrow('Word translation failed: No response');
    });

    it('should throw error if OpenAI returns invalid JSON', async () => {
      const mockOpenAIClient = {
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue({
              choices: [
                {
                  message: {
                    content: 'Invalid JSON',
                  },
                },
              ],
            }),
          },
        },
      } as unknown as OpenAI;

      openaiService.getClient.mockReturnValue(mockOpenAIClient);

      await expect(
        strategy.translateMessageWithWords(
          messageId,
          messageContent,
          apiKey,
          context
        )
      ).rejects.toThrow(HttpException);
      await expect(
        strategy.translateMessageWithWords(
          messageId,
          messageContent,
          apiKey,
          context
        )
      ).rejects.toThrow('Word translation failed: Invalid JSON');
    });

    it('should handle missing fullTranslation by using null', async () => {
      const mockWordTranslations = [
        { originalWord: '你好', translation: 'hello' },
      ];

      const mockOpenAIClient = {
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue({
              choices: [
                {
                  message: {
                    content: JSON.stringify({
                      words: mockWordTranslations,
                      // fullTranslation missing
                    }),
                  },
                },
              ],
            }),
          },
        },
      } as unknown as OpenAI;

      openaiService.getClient.mockReturnValue(mockOpenAIClient);
      wordTranslationRepository.deleteByMessageId.mockResolvedValue(undefined);
      wordTranslationRepository.createMany.mockResolvedValue({ count: 2 });
      translationRepository.create.mockResolvedValue({
        id: 1,
        messageId,
        translation: '',
        createdAt: new Date(),
      });

      const result = await strategy.translateMessageWithWords(
        messageId,
        messageContent,
        apiKey,
        context
      );

      // Should still return word translations even if fullTranslation is missing
      expect(result.wordTranslations).toEqual(mockWordTranslations);
      expect(result.translation).toBe('');
    });

    it('should handle OpenAI API errors', async () => {
      const mockOpenAIClient = {
        chat: {
          completions: {
            create: jest.fn().mockRejectedValue(new Error('API Error')),
          },
        },
      } as unknown as OpenAI;

      openaiService.getClient.mockReturnValue(mockOpenAIClient);

      await expect(
        strategy.translateMessageWithWords(
          messageId,
          messageContent,
          apiKey,
          context
        )
      ).rejects.toThrow(HttpException);
    });
  });
});
