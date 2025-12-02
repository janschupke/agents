import { Test, TestingModule } from '@nestjs/testing';
import { HttpException } from '@nestjs/common';
import { ChatService } from './chat.service';
import { AgentRepository } from '../agent/agent.repository';
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
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there!' },
      ];

      mockAgentRepository.findByIdWithConfig.mockResolvedValue(mockAgent);
      mockSessionRepository.findLatestByAgentId.mockResolvedValue(mockSession);
      mockMessageRepository.findAllBySessionIdForOpenAI.mockResolvedValue(
        mockMessages
      );
      mockMessageRepository.findAllBySessionIdWithRawData.mockResolvedValue(
        mockMessages.map((m, i) => ({ ...m, id: i + 1 }))
      );

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
        'Agent not found'
      );
    });
  });

  describe('sendMessage', () => {
    it('should throw HttpException if agent not found', async () => {
      const agentId = 1;
      const userId = 'user-123';
      const message = 'Hello';
      mockAgentRepository.findByIdWithConfig.mockResolvedValue(null);

      await expect(
        service.sendMessage(agentId, userId, message)
      ).rejects.toThrow(HttpException);
    });

    // Additional tests can be added for sendMessage method
  });
});
