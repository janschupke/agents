import { Test, TestingModule } from '@nestjs/testing';
import { HttpException } from '@nestjs/common';
import { ChatService } from './chat.service';
import { AgentRepository } from '../agent/agent.repository';
import { SessionRepository } from '../session/session.repository';
import { MessageRepository } from '../message/message.repository';
import { AgentMemoryService } from '../memory/agent-memory.service';
import { AgentMemoryRepository } from '../memory/agent-memory.repository';
import { OpenAIService } from '../openai/openai.service';
import { UserService } from '../user/user.service';

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

  const mockMessageRepository = {
    findAllBySessionIdForOpenAI: jest.fn(),
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
    it('should return chat history for existing bot', async () => {
      const botId = 1;
      const userId = 'user-123';
      const mockAgent = {
        id: botId,
        name: 'Test Bot',
        description: 'Test Description',
        config: {},
      };
      const mockSession = {
        id: 1,
        botId,
        sessionName: 'Session 1',
      };
      const mockMessages = [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there!' },
      ];

      mockAgentRepository.findByIdWithConfig.mockResolvedValue(mockBot);
      mockSessionRepository.findLatestByBotId.mockResolvedValue(mockSession);
      mockMessageRepository.findAllBySessionIdForOpenAI.mockResolvedValue(
        mockMessages
      );

      const result = await service.getChatHistory(botId, userId);

      expect(result).toEqual({
        bot: {
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

    it('should create session if not exists', async () => {
      const botId = 1;
      const userId = 'user-123';
      const mockAgent = {
        id: botId,
        name: 'Test Bot',
        description: 'Test Description',
        config: {},
      };
      const mockSession = {
        id: 1,
        botId,
        sessionName: 'Session 1',
      };

      mockAgentRepository.findByIdWithConfig.mockResolvedValue(mockBot);
      mockSessionRepository.findLatestByBotId.mockResolvedValue(null);
      mockSessionRepository.create.mockResolvedValue(mockSession);
      mockMessageRepository.findAllBySessionIdForOpenAI.mockResolvedValue([]);

      await service.getChatHistory(botId, userId);

      expect(mockSessionRepository.create).toHaveBeenCalledWith(userId, botId);
    });

    it('should throw HttpException if bot not found', async () => {
      const botId = 1;
      const userId = 'user-123';
      mockAgentRepository.findByIdWithConfig.mockResolvedValue(null);

      await expect(service.getChatHistory(botId, userId)).rejects.toThrow(
        HttpException
      );
      await expect(service.getChatHistory(botId, userId)).rejects.toThrow(
        'Bot not found'
      );
    });
  });

  describe('sendMessage', () => {
    it('should throw HttpException if bot not found', async () => {
      const botId = 1;
      const userId = 'user-123';
      const message = 'Hello';
      mockAgentRepository.findByIdWithConfig.mockResolvedValue(null);

      await expect(service.sendMessage(botId, userId, message)).rejects.toThrow(
        HttpException
      );
    });

    // Additional tests can be added for sendMessage method
  });
});
