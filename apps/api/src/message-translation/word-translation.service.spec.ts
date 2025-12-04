import { Test, TestingModule } from '@nestjs/testing';
import { WordTranslationService } from './word-translation.service';
import { MessageWordTranslationRepository } from './message-word-translation.repository';
import { OpenAIService } from '../openai/openai.service';
import { MessageTranslationRepository } from './message-translation.repository';
import { AiRequestLogService } from '../ai-request-log/ai-request-log.service';
import OpenAI from 'openai';

describe('WordTranslationService', () => {
  let service: WordTranslationService;
  let wordTranslationRepository: jest.Mocked<MessageWordTranslationRepository>;
  let openaiService: jest.Mocked<OpenAIService>;
  let translationRepository: jest.Mocked<MessageTranslationRepository>;

  const mockWordTranslationRepository = {
    existsForMessage: jest.fn(),
    createMany: jest.fn(),
    findByMessageId: jest.fn(),
    findByMessageIds: jest.fn(),
  };

  const mockOpenAIService = {
    getClient: jest.fn(),
  };

  const mockTranslationRepository = {
    findByMessageId: jest.fn(),
    create: jest.fn(),
  };

  const mockAiRequestLogService = {
    logRequest: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WordTranslationService,
        {
          provide: MessageWordTranslationRepository,
          useValue: mockWordTranslationRepository,
        },
        {
          provide: OpenAIService,
          useValue: mockOpenAIService,
        },
        {
          provide: MessageTranslationRepository,
          useValue: mockTranslationRepository,
        },
        {
          provide: AiRequestLogService,
          useValue: mockAiRequestLogService,
        },
      ],
    }).compile();

    service = module.get<WordTranslationService>(WordTranslationService);
    wordTranslationRepository = module.get(MessageWordTranslationRepository);
    openaiService = module.get(OpenAIService);
    translationRepository = module.get(MessageTranslationRepository);

    jest.clearAllMocks();
  });

  describe('translateWordsInMessage', () => {
    it('should return early if translations already exist', async () => {
      const messageId = 1;
      const messageContent = 'Bonjour';

      wordTranslationRepository.findByMessageId.mockResolvedValue([
        {
          id: 1,
          messageId,
          originalWord: 'Bonjour',
          translation: 'Hello',
          sentenceContext: null,
          createdAt: new Date(),
        },
      ]);

      await service.translateWordsInMessage(
        messageId,
        messageContent,
        'api-key'
      );

      expect(wordTranslationRepository.findByMessageId).toHaveBeenCalledWith(
        messageId
      );
      expect(openaiService.getClient).not.toHaveBeenCalled();
    });

    it('should translate words and save them', async () => {
      const messageId = 1;
      const messageContent = 'Bonjour, comment allez-vous?';
      const apiKey = 'api-key';
      const mockWordTranslations = [
        { originalWord: 'Bonjour', translation: 'Hello' },
        { originalWord: 'comment', translation: 'how' },
        { originalWord: 'allez-vous', translation: 'are you' },
      ];
      const fullTranslation = 'Hello, how are you?';

      const mockOpenAIClient = {
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue({
              choices: [
                {
                  message: {
                    content: JSON.stringify({
                      wordTranslations: mockWordTranslations,
                      fullTranslation,
                    }),
                  },
                },
              ],
            }),
          },
        },
      };

      wordTranslationRepository.findByMessageId.mockResolvedValue([]);
      openaiService.getClient.mockReturnValue(
        mockOpenAIClient as unknown as OpenAI
      );
      wordTranslationRepository.createMany.mockResolvedValue({ count: 3 });
      translationRepository.findByMessageId.mockResolvedValue(null);
      translationRepository.create.mockResolvedValue({
        id: 1,
        messageId,
        translation: fullTranslation,
        createdAt: new Date(),
      });

      await service.translateWordsInMessage(messageId, messageContent, apiKey);

      expect(wordTranslationRepository.createMany).toHaveBeenCalled();
      expect(translationRepository.create).toHaveBeenCalledWith(
        messageId,
        fullTranslation
      );
    });

    it('should not create translation if it already exists', async () => {
      const messageId = 1;
      const messageContent = 'Bonjour';
      const apiKey = 'api-key';
      const existingTranslation = {
        id: 1,
        messageId,
        translation: 'Hello',
        createdAt: new Date(),
      };

      const mockOpenAIClient = {
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue({
              choices: [
                {
                  message: {
                    content: JSON.stringify({
                      wordTranslations: [],
                      fullTranslation: 'Hello',
                    }),
                  },
                },
              ],
            }),
          },
        },
      };

      wordTranslationRepository.existsForMessage.mockResolvedValue(false);
      openaiService.getClient.mockReturnValue(
        mockOpenAIClient as unknown as OpenAI
      );
      wordTranslationRepository.createMany.mockResolvedValue({ count: 3 });
      translationRepository.findByMessageId.mockResolvedValue(
        existingTranslation
      );

      await service.translateWordsInMessage(messageId, messageContent, apiKey);

      expect(translationRepository.create).not.toHaveBeenCalled();
    });

    it('should create full translation from words if OpenAI does not provide it', async () => {
      const messageId = 1;
      const messageContent = 'Bonjour';
      const apiKey = 'api-key';
      const mockWordTranslations = [
        { originalWord: 'Bonjour', translation: 'Hello' },
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
                      fullTranslation: null,
                    }),
                  },
                },
              ],
            }),
          },
        },
      };

      wordTranslationRepository.findByMessageId.mockResolvedValue([]);
      openaiService.getClient.mockReturnValue(
        mockOpenAIClient as unknown as OpenAI
      );
      wordTranslationRepository.createMany.mockResolvedValue({ count: 1 });
      translationRepository.findByMessageId.mockResolvedValue(null);
      translationRepository.create.mockResolvedValue({
        id: 1,
        messageId,
        translation: 'Hello',
        createdAt: new Date(),
      });

      await service.translateWordsInMessage(messageId, messageContent, apiKey);

      expect(translationRepository.create).toHaveBeenCalledWith(
        messageId,
        'Hello'
      );
    });
  });

  describe('getWordTranslationsForMessage', () => {
    it('should return word translations for a message', async () => {
      const messageId = 1;
      const dbWordTranslations = [
        {
          id: 1,
          messageId,
          originalWord: 'Bonjour',
          translation: 'Hello',
          sentenceContext: 'Bonjour',
          createdAt: new Date(),
        },
      ];
      const expectedResult = [
        {
          originalWord: 'Bonjour',
          translation: 'Hello',
          sentenceContext: 'Bonjour',
        },
      ];

      wordTranslationRepository.findByMessageId.mockResolvedValue(
        dbWordTranslations
      );

      const result = await service.getWordTranslationsForMessage(messageId);

      expect(result).toEqual(expectedResult);
      expect(wordTranslationRepository.findByMessageId).toHaveBeenCalledWith(
        messageId
      );
    });
  });

  describe('getWordTranslationsForMessages', () => {
    it('should return empty array for empty message IDs', async () => {
      wordTranslationRepository.findByMessageIds.mockResolvedValue([]);

      const result = await service.getWordTranslationsForMessages([]);

      expect(result).toBeInstanceOf(Map);
      expect(result.size).toBe(0);
      expect(wordTranslationRepository.findByMessageIds).toHaveBeenCalledWith(
        []
      );
    });

    it('should return word translations map for multiple messages', async () => {
      const messageIds = [1, 2];
      const wordTranslations = [
        {
          id: 1,
          messageId: 1,
          originalWord: 'Bonjour',
          translation: 'Hello',
          sentenceContext: 'Bonjour',
          createdAt: new Date(),
        },
        {
          id: 2,
          messageId: 2,
          originalWord: 'Au revoir',
          translation: 'Goodbye',
          sentenceContext: 'Au revoir',
          createdAt: new Date(),
        },
      ];

      wordTranslationRepository.findByMessageIds.mockResolvedValue(
        wordTranslations
      );

      const result = await service.getWordTranslationsForMessages(messageIds);

      expect(result.size).toBe(2);
      expect(result.get(1)).toHaveLength(1);
      expect(result.get(2)).toHaveLength(1);
      expect(wordTranslationRepository.findByMessageIds).toHaveBeenCalledWith(
        messageIds
      );
    });
  });
});
