import { Test, TestingModule } from '@nestjs/testing';
import { HttpException } from '@nestjs/common';
import { ChatService } from './chat.service';
import { AgentRepository } from '../agent/agent.repository';
import { AgentConfigService } from '../agent/services/agent-config.service';
import { SessionRepository } from '../session/session.repository';
import { SessionService } from '../session/session.service';
import { MessageRepository } from '../message/message.repository';
import { AgentMemoryService } from '../memory/agent-memory.service';
import { AgentMemoryRepository } from '../memory/agent-memory.repository';
import { OpenAIService } from '../openai/openai.service';
import { UserService } from '../user/user.service';
import { ApiCredentialsService } from '../api-credentials/api-credentials.service';
import { SystemConfigRepository } from '../system-config/system-config.repository';
import { MessageTranslationService } from '../message-translation/message-translation.service';
import { WordTranslationService } from '../message-translation/word-translation.service';
import { SavedWordService } from '../saved-word/saved-word.service';
import { MessagePreparationService } from './services/message-preparation.service';
import { OpenAIChatService } from './services/openai-chat.service';
import { ChatOrchestrationService } from './services/chat-orchestration.service';
import { LanguageAssistantService } from '../agent/services/language-assistant.service';
import { AgentType } from '../common/enums/agent-type.enum';

describe('ChatService', () => {
  let service: ChatService;

  const mockAgentRepository = {
    findByIdWithConfig: jest.fn(),
    mergeAgentConfig: jest.fn(),
  };

  const mockSessionRepository = {
    findLatestByAgentId: jest.fn(),
    create: jest.fn(),
  };

  const mockSessionService = {
    getSessions: jest.fn(),
    createSession: jest.fn(),
    updateSession: jest.fn(),
    deleteSession: jest.fn(),
  };

  const mockMessageRepository = {
    findAllBySessionIdForOpenAI: jest.fn(),
    findAllBySessionIdWithRawData: jest.fn(),
    findRecentMessagesBySessionId: jest.fn(),
    create: jest.fn(),
  };

  const mockAgentMemoryService = {
    getMemoriesForContext: jest.fn(),
    createMemory: jest.fn(),
    shouldSummarize: jest.fn(),
    summarizeMemories: jest.fn(),
  };

  const mockAgentMemoryRepository = {
    incrementUpdateCount: jest.fn(),
  };

  const mockOpenAIService = {
    generateEmbedding: jest.fn(),
    getClient: jest.fn(),
  };

  const mockUserService = {
    findById: jest.fn(),
  };

  const mockApiCredentialsService = {
    getCredentialsForUser: jest.fn(),
    getApiKey: jest.fn(),
  };

  const mockSystemConfigRepository = {
    getSystemBehaviorRules: jest.fn(),
  };

  const mockMessageTranslationService = {
    translateMessage: jest.fn(),
    getTranslationsForMessages: jest.fn().mockResolvedValue(new Map()),
  };

  const mockWordTranslationService = {
    translateWords: jest.fn(),
    getWordTranslationsForMessages: jest.fn().mockResolvedValue(new Map()),
    saveExtractedTranslations: jest.fn(),
    saveParsedWords: jest.fn(),
    parseWordsInMessage: jest.fn(),
    getWordTranslationsForMessage: jest.fn(),
  };

  const mockAgentConfigService = {
    mergeAgentConfig: jest.fn((config) => ({ ...config })),
  };

  const mockMessagePreparationService = {
    prepareMessages: jest.fn(),
    prepareMessagesForOpenAI: jest.fn(),
    buildOpenAIRequest: jest.fn(),
  };

  const mockOpenAIChatService = {
    createOpenAIRequest: jest.fn(),
    createChatCompletion: jest.fn(),
  };

  const mockSavedWordService = {
    findMatchingWords: jest.fn().mockResolvedValue([]),
  };

  const mockChatOrchestrationService = {
    sendMessage: jest.fn(),
  };

  const mockLanguageAssistantService = {
    isLanguageAssistant: jest.fn(),
    isGeneralAgent: jest.fn(),
    getAgentLanguage: jest.fn(),
    hasLanguage: jest.fn(),
    isValidLanguageCode: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        {
          provide: AgentRepository,
          useValue: mockAgentRepository,
        },
        {
          provide: AgentConfigService,
          useValue: mockAgentConfigService,
        },
        {
          provide: SessionRepository,
          useValue: mockSessionRepository,
        },
        {
          provide: SessionService,
          useValue: mockSessionService,
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
          provide: AgentMemoryRepository,
          useValue: mockAgentMemoryRepository,
        },
        {
          provide: OpenAIService,
          useValue: mockOpenAIService,
        },
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: ApiCredentialsService,
          useValue: mockApiCredentialsService,
        },
        {
          provide: SystemConfigRepository,
          useValue: mockSystemConfigRepository,
        },
        {
          provide: MessageTranslationService,
          useValue: mockMessageTranslationService,
        },
        {
          provide: WordTranslationService,
          useValue: mockWordTranslationService,
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
          provide: SavedWordService,
          useValue: mockSavedWordService,
        },
        {
          provide: ChatOrchestrationService,
          useValue: mockChatOrchestrationService,
        },
        {
          provide: LanguageAssistantService,
          useValue: mockLanguageAssistantService,
        },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getChatHistory', () => {
    it('should return chat history for existing agent', async () => {
      const agentId = 1;
      const userId = 'user-123';
      const mockAgent = {
        id: agentId,
        name: 'Test Agent',
        description: 'Test Description',
        config: {},
      };
      const mockSession = {
        id: 1,
        agentId,
        sessionName: 'Session 1',
      };
      const mockMessages = [
        { role: 'USER', content: 'Hello' },
        { role: 'ASSISTANT', content: 'Hi there!' },
      ];

      mockAgentRepository.findByIdWithConfig.mockResolvedValue(mockAgent);
      mockSessionRepository.findLatestByAgentId.mockResolvedValue(mockSession);
      mockMessageRepository.findAllBySessionIdForOpenAI.mockResolvedValue(
        mockMessages
      );
      mockMessageRepository.findRecentMessagesBySessionId.mockResolvedValue({
        messages: mockMessages.map((m, i) => ({ ...m, id: i + 1 })),
        hasMore: false,
      });

      const result = await service.getChatHistory(agentId, userId);

      expect(result).toMatchObject({
        agent: {
          id: mockAgent.id,
          name: mockAgent.name,
          description: mockAgent.description,
        },
        session: {
          id: mockSession.id,
          session_name: mockSession.sessionName,
        },
        messages: mockMessages,
      });
    });

    it('should return empty history if no session exists', async () => {
      const agentId = 1;
      const userId = 'user-123';
      const mockAgent = {
        id: agentId,
        name: 'Test Agent',
        description: 'Test Description',
        config: {},
      };

      mockAgentRepository.findByIdWithConfig.mockResolvedValue(mockAgent);
      mockSessionRepository.findLatestByAgentId.mockResolvedValue(null);

      const result = await service.getChatHistory(agentId, userId);

      expect(mockSessionRepository.create).not.toHaveBeenCalled();
      expect(result).toEqual({
        agent: {
          id: agentId,
          name: 'Test Agent',
          description: 'Test Description',
        },
        session: null,
        messages: [],
        savedWordMatches: [],
        hasMore: false,
      });
    });

    it('should throw HttpException if agent not found', async () => {
      const agentId = 1;
      const userId = 'user-123';
      mockAgentRepository.findByIdWithConfig.mockResolvedValue(null);

      await expect(service.getChatHistory(agentId, userId)).rejects.toThrow(
        HttpException
      );
      await expect(service.getChatHistory(agentId, userId)).rejects.toThrow(
        `Agent with ID ${agentId} not found`
      );
    });

    it('should not retrieve word translations or saved words for general agents', async () => {
      const agentId = 1;
      const userId = 'user-123';
      const mockAgent = {
        id: agentId,
        name: 'General Agent',
        description: 'Test Description',
        agentType: AgentType.GENERAL,
        config: {},
      };
      const mockSession = {
        id: 1,
        agentId,
        sessionName: 'Session 1',
      };
      const mockMessages = [
        { id: 1, role: 'user', content: 'Hello' },
        { id: 2, role: 'assistant', content: 'Hi there!' },
      ];

      mockAgentRepository.findByIdWithConfig.mockResolvedValue(mockAgent);
      mockSessionRepository.findLatestByAgentId.mockResolvedValue(mockSession);
      mockMessageRepository.findRecentMessagesBySessionId.mockResolvedValue({
        messages: mockMessages,
        hasMore: false,
      });
      mockLanguageAssistantService.isLanguageAssistant.mockReturnValue(false);

      const result = await service.getChatHistory(agentId, userId);

      expect(mockWordTranslationService.getWordTranslationsForMessages).not.toHaveBeenCalled();
      expect(mockSavedWordService.findMatchingWords).not.toHaveBeenCalled();
      expect(result.savedWordMatches).toEqual([]);
      expect(result.messages[1].wordTranslations).toBeUndefined();
    });

    it('should retrieve word translations and saved words for language assistant agents', async () => {
      const agentId = 1;
      const userId = 'user-123';
      const mockAgent = {
        id: agentId,
        name: 'Language Assistant',
        description: 'Test Description',
        agentType: AgentType.LANGUAGE_ASSISTANT,
        config: {},
      };
      const mockSession = {
        id: 1,
        agentId,
        sessionName: 'Session 1',
      };
      const mockMessages = [
        { id: 1, role: 'USER', content: 'Hello' },
        { id: 2, role: 'ASSISTANT', content: '你好' },
      ];
      const mockWordTranslations = new Map([
        [
          2,
          [
            { originalWord: '你好', translation: 'hello', sentenceContext: undefined },
          ],
        ],
      ]);
      const mockSavedWordMatches = [
        {
          originalWord: '你好',
          savedWordId: 1,
          translation: 'hello',
          pinyin: 'ni3hao3',
        },
      ];

      mockAgentRepository.findByIdWithConfig.mockResolvedValue(mockAgent);
      mockSessionRepository.findLatestByAgentId.mockResolvedValue(mockSession);
      mockMessageRepository.findRecentMessagesBySessionId.mockResolvedValue({
        messages: mockMessages,
        hasMore: false,
      });
      mockLanguageAssistantService.isLanguageAssistant.mockReturnValue(true);
      mockWordTranslationService.getWordTranslationsForMessages.mockResolvedValue(
        mockWordTranslations
      );
      mockSavedWordService.findMatchingWords.mockResolvedValue(
        mockSavedWordMatches
      );

      const result = await service.getChatHistory(agentId, userId);

      expect(mockWordTranslationService.getWordTranslationsForMessages).toHaveBeenCalledWith([2]);
      expect(mockSavedWordService.findMatchingWords).toHaveBeenCalledWith(
        userId,
        ['你好']
      );
      expect(result.savedWordMatches).toEqual(mockSavedWordMatches);
      expect(result.messages[1].wordTranslations).toEqual([
        { originalWord: '你好', translation: 'hello', sentenceContext: undefined },
      ]);
    });

    it('should return only 20 most recent messages on initial load', async () => {
      const agentId = 1;
      const userId = 'user-123';
      const mockAgent = {
        id: agentId,
        name: 'Test Agent',
        description: 'Test Description',
        config: {},
      };
      const mockSession = {
        id: 1,
        agentId,
        sessionName: 'Session 1',
      };
      // Create 25 messages (more than 20)
      const allMessages = Array.from({ length: 25 }, (_, i) => ({
        id: i + 1,
        role: i % 2 === 0 ? 'USER' : 'ASSISTANT',
        content: `Message ${i + 1}`,
      }));

      mockAgentRepository.findByIdWithConfig.mockResolvedValue(mockAgent);
      mockSessionRepository.findLatestByAgentId.mockResolvedValue(mockSession);
      // Return 20 messages with hasMore: true
      mockMessageRepository.findRecentMessagesBySessionId.mockResolvedValue({
        messages: allMessages.slice(0, 20), // First 20 (after reverse, these are the newest)
        hasMore: true,
      });
      mockMessageTranslationService.getTranslationsForMessages.mockResolvedValue(
        new Map()
      );
      mockLanguageAssistantService.isLanguageAssistant.mockReturnValue(false);

      const result = await service.getChatHistory(agentId, userId);

      expect(result.messages.length).toBe(20);
      expect(result.hasMore).toBe(true);
      expect(mockMessageRepository.findRecentMessagesBySessionId).toHaveBeenCalledWith(
        1,
        20
      );
    });

    it('should return all messages and set hasMore to false when there are 20 or fewer messages', async () => {
      const agentId = 1;
      const userId = 'user-123';
      const mockAgent = {
        id: agentId,
        name: 'Test Agent',
        description: 'Test Description',
        config: {},
      };
      const mockSession = {
        id: 1,
        agentId,
        sessionName: 'Session 1',
      };
      // Create 15 messages (less than 20)
      const allMessages = Array.from({ length: 15 }, (_, i) => ({
        id: i + 1,
        role: i % 2 === 0 ? 'USER' : 'ASSISTANT',
        content: `Message ${i + 1}`,
      }));

      mockAgentRepository.findByIdWithConfig.mockResolvedValue(mockAgent);
      mockSessionRepository.findLatestByAgentId.mockResolvedValue(mockSession);
      mockMessageRepository.findRecentMessagesBySessionId.mockResolvedValue({
        messages: allMessages,
        hasMore: false,
      });
      mockMessageTranslationService.getTranslationsForMessages.mockResolvedValue(
        new Map()
      );
      mockLanguageAssistantService.isLanguageAssistant.mockReturnValue(false);

      const result = await service.getChatHistory(agentId, userId);

      expect(result.messages.length).toBe(15);
      expect(result.hasMore).toBe(false);
    });

    it('should return messages in chronological order (oldest first)', async () => {
      const agentId = 1;
      const userId = 'user-123';
      const mockAgent = {
        id: agentId,
        name: 'Test Agent',
        description: 'Test Description',
        config: {},
      };
      const mockSession = {
        id: 1,
        agentId,
        sessionName: 'Session 1',
      };
      // Create 5 messages - repository returns them newest first (id DESC), then reverses
      // So we pass them newest first (id 5, 4, 3, 2, 1), repository reverses to (1, 2, 3, 4, 5)
      const messagesNewestFirst = Array.from({ length: 5 }, (_, i) => ({
        id: 5 - i, // IDs: 5, 4, 3, 2, 1 (newest to oldest)
        role: i % 2 === 0 ? 'USER' : 'ASSISTANT',
        content: `Message ${5 - i}`,
        createdAt: new Date(2025, 0, 1 + (5 - i)), // Different dates
      }));

      mockAgentRepository.findByIdWithConfig.mockResolvedValue(mockAgent);
      mockSessionRepository.findLatestByAgentId.mockResolvedValue(mockSession);
      // Repository returns messages newest first, then reverses them internally
      mockMessageRepository.findRecentMessagesBySessionId.mockResolvedValue({
        messages: messagesNewestFirst.reverse(), // Repository already reversed, so we pass oldest first
        hasMore: false,
      });
      mockMessageTranslationService.getTranslationsForMessages.mockResolvedValue(
        new Map()
      );
      mockLanguageAssistantService.isLanguageAssistant.mockReturnValue(false);

      const result = await service.getChatHistory(agentId, userId);

      // Messages should be in chronological order (oldest first)
      expect(result.messages.length).toBe(5);
      expect(result.messages[0].id).toBe(1); // Oldest first
      expect(result.messages[4].id).toBe(5); // Newest last
    });
  });

  describe('sendMessage', () => {
    it('should throw HttpException if agent not found', async () => {
      const agentId = 1;
      const userId = 'user-123';
      const message = 'Hello';
      mockChatOrchestrationService.sendMessage.mockRejectedValue(
        new HttpException('Agent not found', 404)
      );

      await expect(
        service.sendMessage(agentId, userId, message)
      ).rejects.toThrow(HttpException);
    });

    it('should extract translations from JSON response and include in response', async () => {
      const agentId = 1;
      const userId = 'user-123';
      const message = 'Hello';
      const expectedResponse = {
        response: '你好，世界！',
        session: { id: 1, session_name: null },
        rawRequest: {},
        rawResponse: {},
        userMessageId: 1,
        assistantMessageId: 2,
        translation: 'Hello, world!',
        wordTranslations: [
          { originalWord: '你好', translation: 'hello' },
          { originalWord: '世界', translation: 'world' },
        ],
      };

      mockChatOrchestrationService.sendMessage.mockResolvedValue(
        expectedResponse
      );

      const result = await service.sendMessage(agentId, userId, message);

      expect(result).toEqual(expectedResponse);
      expect(mockChatOrchestrationService.sendMessage).toHaveBeenCalledWith({
        agentId,
        userId,
        message,
        sessionId: undefined,
      });
    });

    it('should handle JSON parsing failure gracefully', async () => {
      const agentId = 1;
      const userId = 'user-123';
      const message = 'Hello';
      const chatResponse = '你好，世界！\n{"invalid": "json"'; // Invalid JSON
      const expectedResponse = {
        response: chatResponse,
        session: { id: 1, session_name: null },
        rawRequest: {},
        rawResponse: {},
        userMessageId: 1,
        assistantMessageId: 2,
      };

      mockChatOrchestrationService.sendMessage.mockResolvedValue(
        expectedResponse
      );

      const result = await service.sendMessage(agentId, userId, message);

      expect(result.response).toBe(chatResponse);
      expect(result.translation).toBeUndefined();
      expect(result.wordTranslations).toBeUndefined();
    });

    it('should handle missing translations in JSON gracefully', async () => {
      const agentId = 1;
      const userId = 'user-123';
      const message = 'Hello';
      // JSON missing fullTranslation
      const chatResponse =
        '你好，世界！\n{"words":[{"originalWord":"你好","translation":"hello"}]}';
      const expectedResponse = {
        response: chatResponse,
        session: { id: 1, session_name: null },
        rawRequest: {},
        rawResponse: {},
        userMessageId: 1,
        assistantMessageId: 2,
      };

      mockChatOrchestrationService.sendMessage.mockResolvedValue(
        expectedResponse
      );

      const result = await service.sendMessage(agentId, userId, message);

      expect(result.response).toBe(chatResponse);
      expect(result.translation).toBeUndefined();
    });
  });
});
