import { Test, TestingModule } from '@nestjs/testing';
import { HttpException } from '@nestjs/common';
import { MessageTranslationService } from './message-translation.service';
import { MessageTranslationRepository } from './message-translation.repository';
import { MessageRepository } from '../message/message.repository';
import { SessionRepository } from '../session/session.repository';
import { OpenAIService } from '../openai/openai.service';
import { ApiCredentialsService } from '../api-credentials/api-credentials.service';
import { WordTranslationService } from './word-translation.service';
import { TranslationStrategyFactory } from './translation-strategy.factory';
import {
  ERROR_MESSAGES,
  MAGIC_STRINGS,
} from '../common/constants/error-messages.constants.js';
import OpenAI from 'openai';
import { Message } from '@prisma/client';
import { MessageRole } from '../common/enums/message-role.enum';

describe('MessageTranslationService', () => {
  let service: MessageTranslationService;
  let translationRepository: jest.Mocked<MessageTranslationRepository>;
  let messageRepository: jest.Mocked<MessageRepository>;
  let sessionRepository: jest.Mocked<SessionRepository>;
  let openaiService: jest.Mocked<OpenAIService>;
  let apiCredentialsService: jest.Mocked<ApiCredentialsService>;
  let wordTranslationService: jest.Mocked<WordTranslationService>;
  let translationStrategyFactory: jest.Mocked<TranslationStrategyFactory>;

  const mockTranslationRepository = {
    findByMessageId: jest.fn(),
    create: jest.fn(),
    findByMessageIds: jest.fn(),
  };

  const mockMessageRepository = {
    findById: jest.fn(),
    findAllBySessionId: jest.fn(),
  };

  const mockSessionRepository = {
    findByIdAndUserId: jest.fn(),
  };

  const mockOpenAIService = {
    getClient: jest.fn(),
  };

  const mockApiCredentialsService = {
    getApiKey: jest.fn(),
  };

  const mockWordTranslationService = {
    getWordTranslationsForMessage: jest.fn(),
    translateWordsInMessage: jest.fn(),
    getWordTranslationsForMessages: jest.fn(),
  };

  const mockTranslationStrategyFactory = {
    getStrategy: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessageTranslationService,
        {
          provide: MessageTranslationRepository,
          useValue: mockTranslationRepository,
        },
        {
          provide: MessageRepository,
          useValue: mockMessageRepository,
        },
        {
          provide: SessionRepository,
          useValue: mockSessionRepository,
        },
        {
          provide: OpenAIService,
          useValue: mockOpenAIService,
        },
        {
          provide: ApiCredentialsService,
          useValue: mockApiCredentialsService,
        },
        {
          provide: WordTranslationService,
          useValue: mockWordTranslationService,
        },
        {
          provide: TranslationStrategyFactory,
          useValue: mockTranslationStrategyFactory,
        },
      ],
    }).compile();

    service = module.get<MessageTranslationService>(MessageTranslationService);
    translationRepository = module.get(MessageTranslationRepository);
    messageRepository = module.get(MessageRepository);
    sessionRepository = module.get(SessionRepository);
    openaiService = module.get(OpenAIService);
    apiCredentialsService = module.get(ApiCredentialsService);
    wordTranslationService = module.get(WordTranslationService);
    translationStrategyFactory = module.get(TranslationStrategyFactory);

    jest.clearAllMocks();
  });

  describe('translateMessage', () => {
    it('should return existing translation if available', async () => {
      const messageId = 1;
      const userId = 'user-1';
      const existingTranslation = {
        id: 1,
        messageId,
        translation: 'Existing translation',
        createdAt: new Date(),
      };

      translationRepository.findByMessageId.mockResolvedValue(
        existingTranslation
      );

      const result = await service.translateMessage(messageId, userId);

      expect(result).toEqual({ translation: 'Existing translation' });
      expect(translationRepository.findByMessageId).toHaveBeenCalledWith(
        messageId
      );
      expect(messageRepository.findById).not.toHaveBeenCalled();
    });

    it('should throw error if message not found', async () => {
      const messageId = 1;
      const userId = 'user-1';

      translationRepository.findByMessageId.mockResolvedValue(null);
      messageRepository.findById.mockResolvedValue(null);

      await expect(service.translateMessage(messageId, userId)).rejects.toThrow(
        HttpException
      );
      await expect(service.translateMessage(messageId, userId)).rejects.toThrow(
        `Message with ID ${messageId} not found`
      );
    });

    it('should throw error if session access denied', async () => {
      const messageId = 1;
      const userId = 'user-1';
      const message = {
        id: messageId,
        sessionId: 1,
        role: MessageRole.USER,
        content: 'Test message',
        metadata: null,
        rawRequest: null,
        rawResponse: null,
        createdAt: new Date(),
      };

      translationRepository.findByMessageId.mockResolvedValue(null);
      messageRepository.findById.mockResolvedValue(message);
      sessionRepository.findByIdAndUserId.mockResolvedValue(null);

      await expect(service.translateMessage(messageId, userId)).rejects.toThrow(
        HttpException
      );
      await expect(service.translateMessage(messageId, userId)).rejects.toThrow(
        `Session with ID ${message.sessionId} not found`
      );
    });

    it('should throw error if API key not found', async () => {
      const messageId = 1;
      const userId = 'user-1';
      const message = {
        id: messageId,
        sessionId: 1,
        role: MessageRole.USER,
        content: 'Test message',
        metadata: null,
        rawRequest: null,
        rawResponse: null,
        createdAt: new Date(),
      };
      const session = {
        id: 1,
        userId,
        agentId: 1,
        sessionName: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastMessageAt: null,
      };

      translationRepository.findByMessageId.mockResolvedValue(null);
      messageRepository.findById.mockResolvedValue(message);
      sessionRepository.findByIdAndUserId.mockResolvedValue(session);
      messageRepository.findAllBySessionId.mockResolvedValue([message]);
      apiCredentialsService.getApiKey.mockResolvedValue(null);

      await expect(service.translateMessage(messageId, userId)).rejects.toThrow(
        HttpException
      );
      await expect(service.translateMessage(messageId, userId)).rejects.toThrow(
        ERROR_MESSAGES.OPENAI_API_KEY_REQUIRED
      );
    });

    it('should translate message and save translation', async () => {
      const messageId = 1;
      const userId = 'user-1';
      const apiKey = 'api-key';
      const message = {
        id: messageId,
        sessionId: 1,
        role: MessageRole.USER,
        content: 'Bonjour',
        metadata: null,
        rawRequest: null,
        rawResponse: null,
        createdAt: new Date(),
      };
      const session = {
        id: 1,
        userId,
        agentId: 1,
        sessionName: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastMessageAt: null,
      };
      const mockOpenAIClient = {
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue({
              choices: [
                {
                  message: {
                    content: 'Hello',
                  },
                },
              ],
            }),
          },
        },
      };

      translationRepository.findByMessageId.mockResolvedValue(null);
      messageRepository.findById.mockResolvedValue(message);
      sessionRepository.findByIdAndUserId.mockResolvedValue(session);
      apiCredentialsService.getApiKey.mockResolvedValue(apiKey);
      openaiService.getClient.mockReturnValue(
        mockOpenAIClient as unknown as OpenAI
      );
      messageRepository.findAllBySessionId.mockResolvedValue([
        message as Message,
      ]);
      translationRepository.create.mockResolvedValue({
        id: 1,
        messageId,
        translation: 'Hello',
        createdAt: new Date(),
      });

      const result = await service.translateMessage(messageId, userId);

      expect(result).toEqual({ translation: 'Hello' });
      expect(translationRepository.create).toHaveBeenCalledWith(
        messageId,
        'Hello'
      );
      expect(apiCredentialsService.getApiKey).toHaveBeenCalledWith(
        userId,
        MAGIC_STRINGS.OPENAI_PROVIDER
      );
    });
  });

  describe('getTranslationsForMessages', () => {
    it('should return empty map for empty message IDs', async () => {
      const result = await service.getTranslationsForMessages([]);

      expect(result).toBeInstanceOf(Map);
      expect(result.size).toBe(0);
      expect(translationRepository.findByMessageIds).not.toHaveBeenCalled();
    });

    it('should return translations map for message IDs', async () => {
      const messageIds = [1, 2, 3];
      const translations = [
        {
          id: 1,
          messageId: 1,
          translation: 'Translation 1',
          createdAt: new Date(),
        },
        {
          id: 2,
          messageId: 2,
          translation: 'Translation 2',
          createdAt: new Date(),
        },
      ];

      translationRepository.findByMessageIds.mockResolvedValue(translations);

      const result = await service.getTranslationsForMessages(messageIds);

      expect(result.size).toBe(2);
      expect(result.get(1)).toBe('Translation 1');
      expect(result.get(2)).toBe('Translation 2');
      expect(translationRepository.findByMessageIds).toHaveBeenCalledWith(
        messageIds
      );
    });
  });

  describe('translateMessageWithWords', () => {
    it('should return existing translations if available', async () => {
      const messageId = 1;
      const userId = 'user-1';
      const existingTranslation = {
        id: 1,
        messageId,
        translation: 'Full translation',
        createdAt: new Date(),
      };
      const wordTranslations = [
        {
          id: 1,
          messageId,
          originalWord: 'Bonjour',
          translation: 'Hello',
          sentenceContext: 'Bonjour, comment allez-vous?',
          createdAt: new Date(),
        },
      ];

      const message = {
        id: messageId,
        sessionId: 1,
        role: MessageRole.ASSISTANT,
        content: 'Bonjour',
        metadata: null,
        rawRequest: null,
        rawResponse: null,
        createdAt: new Date(),
      };
      const session = {
        id: 1,
        userId,
        agentId: 1,
        sessionName: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastMessageAt: null,
      };

      messageRepository.findById.mockResolvedValue(message);
      sessionRepository.findByIdAndUserId.mockResolvedValue(session);
      translationRepository.findByMessageId.mockResolvedValue(
        existingTranslation
      );
      wordTranslationService.getWordTranslationsForMessage.mockResolvedValue(
        wordTranslations
      );

      const result = await service.translateMessageWithWords(messageId, userId);

      expect(result).toEqual({
        translation: 'Full translation',
        wordTranslations,
      });
      expect(
        wordTranslationService.translateWordsInMessage
      ).not.toHaveBeenCalled();
    });

    it('should throw error if message not found', async () => {
      const messageId = 1;
      const userId = 'user-1';

      messageRepository.findById.mockResolvedValue(null);

      await expect(
        service.translateMessageWithWords(messageId, userId)
      ).rejects.toThrow(HttpException);
      await expect(
        service.translateMessageWithWords(messageId, userId)
      ).rejects.toThrow(`Message with ID ${messageId} not found`);
    });

    it('should use strategy to create translations for assistant message', async () => {
      const messageId = 1;
      const userId = 'user-1';
      const apiKey = 'api-key';
      const message = {
        id: messageId,
        sessionId: 1,
        role: MessageRole.ASSISTANT,
        content: 'Bonjour',
        metadata: null,
        rawRequest: null,
        rawResponse: null,
        createdAt: new Date(),
      };
      const session = {
        id: 1,
        userId,
        agentId: 1,
        sessionName: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastMessageAt: null,
      };
      const contextMessages = [
        { role: MessageRole.USER, content: 'Hello' },
        { role: MessageRole.ASSISTANT, content: 'Hi!' },
      ];
      const mockStrategy = {
        translateMessageWithWords: jest.fn().mockResolvedValue({
          translation: 'Hello',
          wordTranslations: [
            {
              originalWord: 'Bonjour',
              translation: 'Hello',
              sentenceContext: 'Bonjour',
            },
          ],
        }),
      };

      messageRepository.findById.mockResolvedValue(message);
      sessionRepository.findByIdAndUserId.mockResolvedValue(session);
      translationRepository.findByMessageId.mockResolvedValue(null);
      wordTranslationService.getWordTranslationsForMessage.mockResolvedValue(
        []
      );
      apiCredentialsService.getApiKey.mockResolvedValue(apiKey);
      messageRepository.findAllBySessionId.mockResolvedValue(
        contextMessages as Message[]
      );
      translationStrategyFactory.getStrategy.mockReturnValue(
        mockStrategy as any
      );

      const result = await service.translateMessageWithWords(messageId, userId);

      expect(result).toEqual({
        translation: 'Hello',
        wordTranslations: [
          {
            originalWord: 'Bonjour',
            translation: 'Hello',
            sentenceContext: 'Bonjour',
          },
        ],
      });
      expect(translationStrategyFactory.getStrategy).toHaveBeenCalledWith(
        MessageRole.ASSISTANT
      );
      expect(mockStrategy.translateMessageWithWords).toHaveBeenCalledWith(
        messageId,
        'Bonjour',
        apiKey,
        expect.objectContaining({
          conversationHistory: contextMessages,
          messageRole: MessageRole.ASSISTANT,
        })
      );
    });

    it('should use strategy to create translations for user message', async () => {
      const messageId = 1;
      const userId = 'user-1';
      const apiKey = 'api-key';
      const message = {
        id: messageId,
        sessionId: 1,
        role: MessageRole.USER,
        content: 'Bonjour',
        metadata: null,
        rawRequest: null,
        rawResponse: null,
        createdAt: new Date(),
      };
      const session = {
        id: 1,
        userId,
        agentId: 1,
        sessionName: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastMessageAt: null,
      };
      const mockStrategy = {
        translateMessageWithWords: jest.fn().mockResolvedValue({
          translation: 'Hello',
          wordTranslations: [
            {
              originalWord: 'Bonjour',
              translation: 'Hello',
            },
          ],
        }),
      };

      messageRepository.findById.mockResolvedValue(message);
      sessionRepository.findByIdAndUserId.mockResolvedValue(session);
      translationRepository.findByMessageId.mockResolvedValue(null);
      wordTranslationService.getWordTranslationsForMessage.mockResolvedValue(
        []
      );
      apiCredentialsService.getApiKey.mockResolvedValue(apiKey);
      translationStrategyFactory.getStrategy.mockReturnValue(
        mockStrategy as any
      );

      const result = await service.translateMessageWithWords(messageId, userId);

      expect(result).toEqual({
        translation: 'Hello',
        wordTranslations: [
          {
            originalWord: 'Bonjour',
            translation: 'Hello',
          },
        ],
      });
      expect(translationStrategyFactory.getStrategy).toHaveBeenCalledWith(
        MessageRole.USER
      );
      expect(mockStrategy.translateMessageWithWords).toHaveBeenCalledWith(
        messageId,
        'Bonjour',
        apiKey,
        expect.objectContaining({
          messageRole: MessageRole.USER,
        })
      );
      // User messages should not have conversation history
      expect(
        mockStrategy.translateMessageWithWords.mock.calls[0][3]
      ).not.toHaveProperty('conversationHistory');
    });
  });
});
