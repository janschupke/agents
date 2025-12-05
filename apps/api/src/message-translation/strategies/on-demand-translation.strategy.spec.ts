import { Test, TestingModule } from '@nestjs/testing';
import { OnDemandTranslationStrategy } from './on-demand-translation.strategy';
import { WordTranslationService } from '../word-translation.service';
import { MessageTranslationRepository } from '../message-translation.repository';
import { AiRequestLogService } from '../../ai-request-log/ai-request-log.service';
import { TranslationContext } from '../translation-strategy.interface';
import { MessageRole } from '@openai/shared-types';

describe('OnDemandTranslationStrategy', () => {
  let strategy: OnDemandTranslationStrategy;
  let wordTranslationService: jest.Mocked<WordTranslationService>;
  let translationRepository: jest.Mocked<MessageTranslationRepository>;

  const mockWordTranslationService = {
    translateWordsInMessage: jest.fn(),
    getWordTranslationsForMessage: jest.fn(),
  };

  const mockTranslationRepository = {
    findByMessageId: jest.fn(),
  };

  const mockAiRequestLogService = {
    logRequest: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OnDemandTranslationStrategy,
        {
          provide: WordTranslationService,
          useValue: mockWordTranslationService,
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

    strategy = module.get<OnDemandTranslationStrategy>(
      OnDemandTranslationStrategy
    );
    wordTranslationService = module.get(WordTranslationService);
    translationRepository = module.get(MessageTranslationRepository);

    jest.clearAllMocks();
  });

  describe('translateMessageWithWords', () => {
    const messageId = 1;
    const messageContent = 'Bonjour';
    const apiKey = 'test-api-key';
    const context: TranslationContext = {
      messageRole: MessageRole.USER,
    };

    it('should translate message using word translation service', async () => {
      const wordTranslations = [
        {
          originalWord: 'Bonjour',
          translation: 'Hello',
          sentenceContext: 'Bonjour',
        },
      ];
      const fullTranslation = {
        id: 1,
        messageId,
        translation: 'Hello',
        createdAt: new Date(),
      };

      wordTranslationService.translateWordsInMessage.mockResolvedValue(
        undefined
      );
      wordTranslationService.getWordTranslationsForMessage.mockResolvedValue(
        wordTranslations
      );
      translationRepository.findByMessageId.mockResolvedValue(fullTranslation);

      const result = await strategy.translateMessageWithWords(
        messageId,
        messageContent,
        apiKey,
        context
      );

      expect(result).toEqual({
        translation: 'Hello',
        wordTranslations,
      });

      expect(
        wordTranslationService.translateWordsInMessage
      ).toHaveBeenCalledWith(
        messageId,
        messageContent,
        apiKey,
        undefined,
        undefined
      );
      expect(
        wordTranslationService.getWordTranslationsForMessage
      ).toHaveBeenCalledWith(messageId);
      expect(translationRepository.findByMessageId).toHaveBeenCalledWith(
        messageId
      );
    });

    it('should derive translation from word translations if full translation not available', async () => {
      const wordTranslations = [
        {
          originalWord: 'Bonjour',
          translation: 'Hello',
          sentenceContext: 'Bonjour',
        },
        {
          originalWord: 'monde',
          translation: 'world',
          sentenceContext: 'Bonjour monde',
        },
      ];

      wordTranslationService.translateWordsInMessage.mockResolvedValue(
        undefined
      );
      wordTranslationService.getWordTranslationsForMessage.mockResolvedValue(
        wordTranslations
      );
      translationRepository.findByMessageId.mockResolvedValue(null);

      const result = await strategy.translateMessageWithWords(
        messageId,
        messageContent,
        apiKey,
        context
      );

      expect(result).toEqual({
        translation: 'Hello world',
        wordTranslations,
      });
    });

    it('should throw error if no translations available', async () => {
      wordTranslationService.translateWordsInMessage.mockResolvedValue(
        undefined
      );
      wordTranslationService.getWordTranslationsForMessage.mockResolvedValue(
        []
      );
      translationRepository.findByMessageId.mockResolvedValue(null);

      await expect(
        strategy.translateMessageWithWords(
          messageId,
          messageContent,
          apiKey,
          context
        )
      ).rejects.toThrow('Translation failed: No translation available');
    });

    it('should filter out empty translations when deriving', async () => {
      const wordTranslations = [
        {
          originalWord: 'Bonjour',
          translation: 'Hello',
          sentenceContext: 'Bonjour',
        },
        {
          originalWord: ' ',
          translation: '',
          sentenceContext: '',
        },
        {
          originalWord: 'monde',
          translation: 'world',
          sentenceContext: 'Bonjour monde',
        },
      ];

      wordTranslationService.translateWordsInMessage.mockResolvedValue(
        undefined
      );
      wordTranslationService.getWordTranslationsForMessage.mockResolvedValue(
        wordTranslations
      );
      translationRepository.findByMessageId.mockResolvedValue(null);

      const result = await strategy.translateMessageWithWords(
        messageId,
        messageContent,
        apiKey,
        context
      );

      expect(result.translation).toBe('Hello world');
    });
  });
});
