import { Test, TestingModule } from '@nestjs/testing';
import { WordTranslationService } from './word-translation.service';
import { WordParsingService } from './services/word-parsing.service';
import { WordTranslationOpenAIService } from './services/word-translation-openai.service';
import { WordTranslationStorageService } from './services/word-translation-storage.service';

describe('WordTranslationService', () => {
  let service: WordTranslationService;
  let wordParsingService: jest.Mocked<WordParsingService>;
  let wordTranslationOpenAIService: jest.Mocked<WordTranslationOpenAIService>;
  let wordTranslationStorageService: jest.Mocked<WordTranslationStorageService>;

  const mockWordParsingService = {
    splitIntoSentences: jest.fn(),
    createWordToSentenceMap: jest.fn(),
    parseWordsWithOpenAI: jest.fn(),
  };

  const mockWordTranslationOpenAIService = {
    translatePreParsedWordsWithOpenAI: jest.fn(),
    translateWordsWithOpenAI: jest.fn(),
  };

  const mockWordTranslationStorageService = {
    saveParsedWords: jest.fn(),
    saveExtractedTranslations: jest.fn(),
    createFullTranslationFromWords: jest.fn(),
    getWordTranslationsForMessage: jest.fn(),
    getWordTranslationsForMessages: jest.fn(),
    existsForMessage: jest.fn(),
    updateWordsWithTranslations: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WordTranslationService,
        {
          provide: WordParsingService,
          useValue: mockWordParsingService,
        },
        {
          provide: WordTranslationOpenAIService,
          useValue: mockWordTranslationOpenAIService,
        },
        {
          provide: WordTranslationStorageService,
          useValue: mockWordTranslationStorageService,
        },
      ],
    }).compile();

    service = module.get<WordTranslationService>(WordTranslationService);
    wordParsingService = module.get(WordParsingService);
    wordTranslationOpenAIService = module.get(WordTranslationOpenAIService);
    wordTranslationStorageService = module.get(WordTranslationStorageService);

    jest.clearAllMocks();
  });

  describe('translateWordsInMessage', () => {
    it('should return early if translations already exist', async () => {
      const messageId = 1;
      const messageContent = 'Bonjour';

      wordTranslationStorageService.getWordTranslationsForMessage.mockResolvedValue(
        [
          {
            originalWord: 'Bonjour',
            translation: 'Hello',
            sentenceContext: undefined,
          },
        ]
      );

      await service.translateWordsInMessage(
        messageId,
        messageContent,
        'api-key'
      );

      expect(
        wordTranslationStorageService.getWordTranslationsForMessage
      ).toHaveBeenCalledWith(messageId);
      expect(
        wordTranslationOpenAIService.translateWordsWithOpenAI
      ).not.toHaveBeenCalled();
    });

    it('should translate words and save them', async () => {
      const messageId = 1;
      const messageContent = 'Bonjour, comment allez-vous?';
      const apiKey = 'api-key';
      const sentences = ['Bonjour, comment allez-vous?'];
      const mockWordTranslations = [
        { originalWord: 'Bonjour', translation: 'Hello' },
        { originalWord: 'comment', translation: 'how' },
        { originalWord: 'allez-vous', translation: 'are you' },
      ];
      const fullTranslation = 'Hello, how are you?';

      wordTranslationStorageService.getWordTranslationsForMessage.mockResolvedValue(
        []
      );
      wordParsingService.splitIntoSentences.mockReturnValue(sentences);
      wordTranslationOpenAIService.translateWordsWithOpenAI.mockResolvedValue({
        wordTranslations: mockWordTranslations,
        fullTranslation,
      });
      wordParsingService.createWordToSentenceMap.mockReturnValue(new Map());
      wordTranslationStorageService.saveExtractedTranslations.mockResolvedValue(
        undefined
      );

      await service.translateWordsInMessage(messageId, messageContent, apiKey);

      expect(
        wordTranslationOpenAIService.translateWordsWithOpenAI
      ).toHaveBeenCalledWith(messageContent, sentences, apiKey, undefined);
      // updateWordsWithTranslations is called instead of saveExtractedTranslations
      expect(
        wordTranslationStorageService.updateWordsWithTranslations
      ).toHaveBeenCalledWith(
        messageId,
        mockWordTranslations,
        expect.any(Map),
        fullTranslation
      );
    });

    it('should not create translation if it already exists', async () => {
      const messageId = 1;
      const messageContent = 'Bonjour';
      const apiKey = 'api-key';

      // Mock existing words with translations (so hasTranslations returns true)
      wordTranslationStorageService.getWordTranslationsForMessage.mockResolvedValue(
        [
          {
            originalWord: 'Bonjour',
            translation: 'Hello',
            sentenceContext: undefined,
          },
        ]
      );

      await service.translateWordsInMessage(messageId, messageContent, apiKey);

      // Should return early without calling OpenAI or storage
      expect(
        wordTranslationOpenAIService.translateWordsWithOpenAI
      ).not.toHaveBeenCalled();
      expect(
        wordTranslationStorageService.updateWordsWithTranslations
      ).not.toHaveBeenCalled();
    });

    it('should create full translation from words if OpenAI does not provide it', async () => {
      const messageId = 1;
      const messageContent = 'Bonjour';
      const apiKey = 'api-key';
      const sentences = ['Bonjour'];
      const mockWordTranslations = [
        { originalWord: 'Bonjour', translation: 'Hello' },
      ];

      wordTranslationStorageService.getWordTranslationsForMessage.mockResolvedValue(
        []
      );
      wordParsingService.splitIntoSentences.mockReturnValue(sentences);
      wordTranslationOpenAIService.translateWordsWithOpenAI.mockResolvedValue({
        wordTranslations: mockWordTranslations,
        fullTranslation: null,
      });
      wordParsingService.createWordToSentenceMap.mockReturnValue(new Map());
      wordTranslationStorageService.saveExtractedTranslations.mockResolvedValue(
        undefined
      );
      wordTranslationStorageService.createFullTranslationFromWords.mockResolvedValue(
        undefined
      );

      await service.translateWordsInMessage(messageId, messageContent, apiKey);

      expect(
        wordTranslationStorageService.createFullTranslationFromWords
      ).toHaveBeenCalledWith(messageId, mockWordTranslations);
    });
  });

  describe('getWordTranslationsForMessage', () => {
    it('should return word translations for a message', async () => {
      const messageId = 1;
      const expectedResult = [
        {
          originalWord: 'Bonjour',
          translation: 'Hello',
          sentenceContext: 'Bonjour',
        },
      ];

      wordTranslationStorageService.getWordTranslationsForMessage.mockResolvedValue(
        expectedResult
      );

      const result = await service.getWordTranslationsForMessage(messageId);

      expect(result).toEqual(expectedResult);
      expect(
        wordTranslationStorageService.getWordTranslationsForMessage
      ).toHaveBeenCalledWith(messageId);
    });
  });

  describe('getWordTranslationsForMessages', () => {
    it('should return empty array for empty message IDs', async () => {
      wordTranslationStorageService.getWordTranslationsForMessages.mockResolvedValue(
        new Map()
      );

      const result = await service.getWordTranslationsForMessages([]);

      expect(result).toBeInstanceOf(Map);
      expect(result.size).toBe(0);
      expect(
        wordTranslationStorageService.getWordTranslationsForMessages
      ).toHaveBeenCalledWith([]);
    });

    it('should return word translations map for multiple messages', async () => {
      const messageIds = [1, 2];
      const expectedMap = new Map([
        [
          1,
          [
            {
              originalWord: 'Bonjour',
              translation: 'Hello',
              sentenceContext: 'Bonjour',
            },
          ],
        ],
        [
          2,
          [
            {
              originalWord: 'Au revoir',
              translation: 'Goodbye',
              sentenceContext: 'Au revoir',
            },
          ],
        ],
      ]);

      wordTranslationStorageService.getWordTranslationsForMessages.mockResolvedValue(
        expectedMap
      );

      const result = await service.getWordTranslationsForMessages(messageIds);

      expect(result.size).toBe(2);
      expect(result.get(1)).toHaveLength(1);
      expect(result.get(2)).toHaveLength(1);
      expect(
        wordTranslationStorageService.getWordTranslationsForMessages
      ).toHaveBeenCalledWith(messageIds);
    });
  });
});
