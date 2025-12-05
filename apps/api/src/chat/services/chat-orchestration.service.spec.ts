import { Test, TestingModule } from '@nestjs/testing';
import { ChatOrchestrationService } from './chat-orchestration.service';
import { AgentRepository } from '../../agent/agent.repository';
import { AgentConfigService } from '../../agent/services/agent-config.service';
import { LanguageAssistantService } from '../../agent/services/language-assistant.service';
import { SessionRepository } from '../../session/session.repository';
import { MessageRepository } from '../../message/message.repository';
import { AgentMemoryService } from '../../memory/agent-memory.service';
import { ApiCredentialsService } from '../../api-credentials/api-credentials.service';
import { WordTranslationService } from '../../message-translation/word-translation.service';
import { SavedWordService } from '../../saved-word/saved-word.service';
import { MessagePreparationService } from './message-preparation.service';
import { OpenAIChatService } from './openai-chat.service';
import { TranslationExtractionService } from './translation-extraction.service';
import { AgentType, MessageRole } from '@openai/shared-types';
import { ApiKeyRequiredException } from '../../common/exceptions';
import type OpenAI from 'openai';

describe('ChatOrchestrationService', () => {
  let service: ChatOrchestrationService;

  const mockAgentRepository = {
    findByIdWithConfig: jest.fn(),
  };

  const mockAgentConfigService = {
    mergeAgentConfig: jest.fn((config) => ({ ...config })),
  };

  const mockLanguageAssistantService = {
    isLanguageAssistant: jest.fn(),
    isGeneralAgent: jest.fn(),
    getAgentLanguage: jest.fn(),
    hasLanguage: jest.fn(),
    isValidLanguageCode: jest.fn(),
  };

  const mockSessionRepository = {
    findByIdAndUserId: jest.fn(),
    findLatestByAgentId: jest.fn(),
    create: jest.fn(),
  };

  const mockMessageRepository = {
    create: jest.fn(),
    findAllBySessionIdForOpenAI: jest.fn(),
  };

  const mockAgentMemoryService = {
    getMemoriesForContext: jest.fn().mockResolvedValue([]),
    createMemory: jest.fn().mockResolvedValue(0),
  };

  const mockApiCredentialsService = {
    getApiKey: jest.fn(),
  };

  const mockWordTranslationService = {
    saveExtractedTranslations: jest.fn(),
    saveParsedWords: jest.fn(),
    parseWordsInMessage: jest.fn(),
    getWordTranslationsForMessage: jest.fn().mockResolvedValue([]),
  };

  const mockSavedWordService = {
    findMatchingWords: jest.fn().mockResolvedValue([]),
  };

  const mockMessagePreparationService = {
    prepareMessagesForOpenAI: jest.fn(),
    buildOpenAIRequest: jest.fn(),
  };

  const mockOpenAIChatService = {
    createOpenAIRequest: jest.fn().mockReturnValue({}),
    createChatCompletion: jest.fn(),
  };

  const mockTranslationExtractionService = {
    extractTranslationsFromResponse: jest.fn().mockReturnValue({
      words: [],
      fullTranslation: undefined,
      cleanedResponse: 'Test response',
      extracted: false,
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatOrchestrationService,
        {
          provide: AgentRepository,
          useValue: mockAgentRepository,
        },
        {
          provide: AgentConfigService,
          useValue: mockAgentConfigService,
        },
        {
          provide: LanguageAssistantService,
          useValue: mockLanguageAssistantService,
        },
        {
          provide: SessionRepository,
          useValue: mockSessionRepository,
        },
        {
          provide: MessageRepository,
          useValue: mockMessageRepository,
        },
        {
          provide: AgentMemoryService,
          useValue: mockAgentMemoryService,
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
          provide: SavedWordService,
          useValue: mockSavedWordService,
        },
        {
          provide: MessagePreparationService,
          useValue: mockMessagePreparationService,
        },
        {
          provide: OpenAIChatService,
          useValue: mockOpenAIChatService,
        },
        {
          provide: TranslationExtractionService,
          useValue: mockTranslationExtractionService,
        },
      ],
    }).compile();

    service = module.get<ChatOrchestrationService>(ChatOrchestrationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendMessage', () => {
    const agentId = 1;
    const userId = 'user-123';
    const message = 'Hello';
    const apiKey = 'test-api-key';

    const mockAgent = {
      id: agentId,
      name: 'Test Agent',
      description: 'Test Description',
      agentType: AgentType.GENERAL,
      language: null,
      configs: {},
    };

    const mockSession = {
      id: 1,
      agentId,
      sessionName: 'Test Session',
    };

    const mockUserMessage = {
      id: 1,
      role: MessageRole.USER,
      content: message,
    };

    const mockAssistantMessage = {
      id: 2,
      role: MessageRole.ASSISTANT,
      content: 'Test response',
    };

    const mockOpenAICompletion = {
      choices: [
        {
          message: {
            role: 'assistant',
            content: 'Test response',
          },
        },
      ],
    } as OpenAI.Chat.Completions.ChatCompletion;

    beforeEach(() => {
      mockApiCredentialsService.getApiKey.mockResolvedValue(apiKey);
      mockAgentRepository.findByIdWithConfig.mockResolvedValue(mockAgent);
      mockSessionRepository.findLatestByAgentId.mockResolvedValue(mockSession);
      mockMessageRepository.create
        .mockResolvedValueOnce(mockUserMessage)
        .mockResolvedValueOnce(mockAssistantMessage);
      mockMessageRepository.findAllBySessionIdForOpenAI.mockResolvedValue([
        mockUserMessage,
      ]);
      mockMessagePreparationService.prepareMessagesForOpenAI.mockResolvedValue(
        []
      );
      mockMessagePreparationService.buildOpenAIRequest.mockReturnValue({});
      mockOpenAIChatService.createChatCompletion.mockResolvedValue({
        response: 'Test response',
        completion: mockOpenAICompletion,
      });
    });

    it('should not save translations or retrieve words for general agents', async () => {
      mockLanguageAssistantService.isLanguageAssistant.mockReturnValue(false);

      await service.sendMessage({
        agentId,
        userId,
        message,
      });

      expect(
        mockWordTranslationService.saveExtractedTranslations
      ).not.toHaveBeenCalled();
      expect(mockWordTranslationService.saveParsedWords).not.toHaveBeenCalled();
      expect(
        mockWordTranslationService.parseWordsInMessage
      ).not.toHaveBeenCalled();
      expect(
        mockWordTranslationService.getWordTranslationsForMessage
      ).not.toHaveBeenCalled();
      expect(mockSavedWordService.findMatchingWords).not.toHaveBeenCalled();
    });

    it('should save translations and retrieve words for language assistant agents', async () => {
      const extractedWords = [{ originalWord: '你好', translation: 'hello' }];
      const extractedTranslation = 'Hello';

      mockLanguageAssistantService.isLanguageAssistant.mockReturnValue(true);
      mockTranslationExtractionService.extractTranslationsFromResponse.mockReturnValue(
        {
          words: extractedWords,
          fullTranslation: extractedTranslation,
          cleanedResponse: '你好',
          extracted: true,
        }
      );
      mockWordTranslationService.getWordTranslationsForMessage.mockResolvedValue(
        [{ originalWord: '你好', translation: 'hello' }]
      );
      mockSavedWordService.findMatchingWords.mockResolvedValue([
        {
          originalWord: '你好',
          savedWordId: 1,
          translation: 'hello',
          pinyin: 'ni3hao3',
        },
      ]);

      const result = await service.sendMessage({
        agentId,
        userId,
        message,
      });

      expect(
        mockWordTranslationService.saveExtractedTranslations
      ).toHaveBeenCalled();
      // When translations are extracted, getWordTranslationsForMessage is not called
      // Instead, extracted words are used directly
      expect(mockSavedWordService.findMatchingWords).toHaveBeenCalledWith(
        userId,
        ['你好']
      );
      expect(result.wordTranslations).toBeDefined();
      expect(result.savedWordMatches).toBeDefined();
    });

    it('should not include word translations or saved word matches in response for general agents', async () => {
      mockLanguageAssistantService.isLanguageAssistant.mockReturnValue(false);

      const result = await service.sendMessage({
        agentId,
        userId,
        message,
      });

      expect(result.wordTranslations).toBeUndefined();
      expect(result.savedWordMatches).toBeUndefined();
      expect(result.translation).toBeUndefined();
    });

    it('should throw ApiKeyRequiredException if no API key found', async () => {
      mockApiCredentialsService.getApiKey.mockResolvedValue(null);

      await expect(
        service.sendMessage({
          agentId,
          userId,
          message,
        })
      ).rejects.toThrow(ApiKeyRequiredException);
    });
  });
});
