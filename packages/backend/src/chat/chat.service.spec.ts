import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { ChatService } from './chat.service';
import { BotRepository } from '../bot/repository/bot.repository';
import { SessionRepository } from '../session/repository/session.repository';
import { MessageRepository } from '../message/repository/message.repository';
import { MemoryRepository } from '../memory/repository/memory.repository';
import { OpenAIService } from '../openai/openai.service';

describe('ChatService', () => {
  let service: ChatService;
  let botRepository: BotRepository;
  let sessionRepository: SessionRepository;
  let messageRepository: MessageRepository;
  let memoryRepository: MemoryRepository;
  let openaiService: OpenAIService;

  const mockBotRepository = {
    findByIdWithConfig: jest.fn(),
    mergeBotConfig: jest.fn(),
  };

  const mockSessionRepository = {
    findLatestByBotId: jest.fn(),
    create: jest.fn(),
  };

  const mockMessageRepository = {
    findAllBySessionIdForOpenAI: jest.fn(),
    create: jest.fn(),
  };

  const mockMemoryRepository = {
    findSimilarForBot: jest.fn(),
    create: jest.fn(),
  };

  const mockOpenAIService = {
    generateEmbedding: jest.fn(),
    getClient: jest.fn(),
    createMemoryChunkFromMessages: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        {
          provide: BotRepository,
          useValue: mockBotRepository,
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
          provide: MemoryRepository,
          useValue: mockMemoryRepository,
        },
        {
          provide: OpenAIService,
          useValue: mockOpenAIService,
        },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
    botRepository = module.get<BotRepository>(BotRepository);
    sessionRepository = module.get<SessionRepository>(SessionRepository);
    messageRepository = module.get<MessageRepository>(MessageRepository);
    memoryRepository = module.get<MemoryRepository>(MemoryRepository);
    openaiService = module.get<OpenAIService>(OpenAIService);
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
      const mockBot = {
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

      mockBotRepository.findByIdWithConfig.mockResolvedValue(mockBot);
      mockSessionRepository.findLatestByBotId.mockResolvedValue(mockSession);
      mockMessageRepository.findAllBySessionIdForOpenAI.mockResolvedValue(
        mockMessages,
      );

      const result = await service.getChatHistory(botId);

      expect(result).toEqual({
        bot: {
          id: mockBot.id,
          name: mockBot.name,
          description: mockBot.description,
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
      const mockBot = {
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

      mockBotRepository.findByIdWithConfig.mockResolvedValue(mockBot);
      mockSessionRepository.findLatestByBotId.mockResolvedValue(null);
      mockSessionRepository.create.mockResolvedValue(mockSession);
      mockMessageRepository.findAllBySessionIdForOpenAI.mockResolvedValue([]);

      await service.getChatHistory(botId);

      expect(mockSessionRepository.create).toHaveBeenCalledWith(botId);
    });

    it('should throw HttpException if bot not found', async () => {
      const botId = 1;
      mockBotRepository.findByIdWithConfig.mockResolvedValue(null);

      await expect(service.getChatHistory(botId)).rejects.toThrow(
        HttpException,
      );
      await expect(service.getChatHistory(botId)).rejects.toThrow(
        'Bot not found',
      );
    });
  });

  describe('sendMessage', () => {
    it('should throw HttpException if bot not found', async () => {
      const botId = 1;
      const message = 'Hello';
      mockBotRepository.findByIdWithConfig.mockResolvedValue(null);

      await expect(service.sendMessage(botId, message)).rejects.toThrow(
        HttpException,
      );
    });

    // Additional tests can be added for sendMessage method
  });
});
