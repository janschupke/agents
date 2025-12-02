import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { AuthenticatedUser } from '../common/types/auth.types';

describe('ChatController', () => {
  let controller: ChatController;
  let chatService: ChatService;

  const mockChatService = {
    getSessions: jest.fn(),
    createSession: jest.fn(),
    getChatHistory: jest.fn(),
    sendMessage: jest.fn(),
    deleteSession: jest.fn(),
  };

  const mockUser: AuthenticatedUser = {
    id: 'user-123',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    imageUrl: null,
    roles: ['user'],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChatController],
      providers: [
        {
          provide: ChatService,
          useValue: mockChatService,
        },
      ],
    }).compile();

    controller = module.get<ChatController>(ChatController);
    chatService = module.get<ChatService>(ChatService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getSessions', () => {
    it('should return sessions for an agent', async () => {
      const agentId = 1;
      const mockSessions = [
        { id: 1, session_name: 'Session 1', createdAt: new Date() },
        { id: 2, session_name: 'Session 2', createdAt: new Date() },
      ];

      mockChatService.getSessions.mockResolvedValue(mockSessions);

      const result = await controller.getSessions(agentId, mockUser);

      expect(result).toEqual(mockSessions);
      expect(chatService.getSessions).toHaveBeenCalledWith(
        agentId,
        mockUser.id
      );
    });

    it('should throw HttpException on service error', async () => {
      const agentId = 1;
      const error = new HttpException('Agent not found', HttpStatus.NOT_FOUND);
      mockChatService.getSessions.mockRejectedValue(error);

      await expect(controller.getSessions(agentId, mockUser)).rejects.toThrow(
        HttpException
      );
      await expect(controller.getSessions(agentId, mockUser)).rejects.toThrow(
        'Agent not found'
      );
    });
  });

  describe('createSession', () => {
    it('should create a new session', async () => {
      const agentId = 1;
      const mockSession = {
        id: 1,
        session_name: 'New Session',
        createdAt: new Date(),
      };

      mockChatService.createSession.mockResolvedValue(mockSession);

      const result = await controller.createSession(agentId, mockUser);

      expect(result).toEqual(mockSession);
      expect(chatService.createSession).toHaveBeenCalledWith(
        agentId,
        mockUser.id
      );
    });

    it('should throw HttpException on service error', async () => {
      const agentId = 1;
      const error = new HttpException('Agent not found', HttpStatus.NOT_FOUND);
      mockChatService.createSession.mockRejectedValue(error);

      await expect(controller.createSession(agentId, mockUser)).rejects.toThrow(
        HttpException
      );
      await expect(controller.createSession(agentId, mockUser)).rejects.toThrow(
        'Agent not found'
      );
    });
  });

  describe('getChatHistory', () => {
    it('should return chat history without sessionId', async () => {
      const agentId = 1;
      const mockHistory = {
        agent: { id: agentId, name: 'Test Agent', description: 'Test' },
        session: { id: 1, session_name: 'Session 1' },
        messages: [
          { role: 'user', content: 'Hello' },
          { role: 'assistant', content: 'Hi there!' },
        ],
      };

      mockChatService.getChatHistory.mockResolvedValue(mockHistory);

      const result = await controller.getChatHistory(agentId, mockUser);

      expect(result).toEqual(mockHistory);
      expect(chatService.getChatHistory).toHaveBeenCalledWith(
        agentId,
        mockUser.id,
        undefined
      );
    });

    it('should return chat history with sessionId', async () => {
      const agentId = 1;
      const sessionId = '5';
      const mockHistory = {
        agent: { id: agentId, name: 'Test Agent', description: 'Test' },
        session: { id: 5, session_name: 'Session 5' },
        messages: [],
      };

      mockChatService.getChatHistory.mockResolvedValue(mockHistory);

      const result = await controller.getChatHistory(
        agentId,
        mockUser,
        sessionId
      );

      expect(result).toEqual(mockHistory);
      expect(chatService.getChatHistory).toHaveBeenCalledWith(
        agentId,
        mockUser.id,
        5
      );
    });

    it('should throw HttpException on service error', async () => {
      const agentId = 1;
      const error = new HttpException('Agent not found', HttpStatus.NOT_FOUND);
      mockChatService.getChatHistory.mockRejectedValue(error);

      await expect(
        controller.getChatHistory(agentId, mockUser)
      ).rejects.toThrow(HttpException);
      await expect(
        controller.getChatHistory(agentId, mockUser)
      ).rejects.toThrow('Agent not found');
    });
  });

  describe('sendMessage', () => {
    it('should send a message', async () => {
      const agentId = 1;
      const sendMessageDto = { message: 'Hello' };
      const mockResponse = {
        response: 'Hi there!',
        session: { id: 1, session_name: 'Session 1' },
        rawRequest: {},
        rawResponse: {},
      };

      mockChatService.sendMessage.mockResolvedValue(mockResponse);

      const result = await controller.sendMessage(
        agentId,
        sendMessageDto,
        mockUser
      );

      expect(result).toEqual(mockResponse);
      expect(chatService.sendMessage).toHaveBeenCalledWith(
        agentId,
        mockUser.id,
        sendMessageDto.message,
        undefined
      );
    });

    it('should send a message with sessionId', async () => {
      const agentId = 1;
      const sessionId = '5';
      const sendMessageDto = { message: 'Hello' };
      const mockResponse = {
        response: 'Hi there!',
        session: { id: 5, session_name: 'Session 5' },
        rawRequest: {},
        rawResponse: {},
      };

      mockChatService.sendMessage.mockResolvedValue(mockResponse);

      const result = await controller.sendMessage(
        agentId,
        sendMessageDto,
        mockUser,
        sessionId
      );

      expect(result).toEqual(mockResponse);
      expect(chatService.sendMessage).toHaveBeenCalledWith(
        agentId,
        mockUser.id,
        sendMessageDto.message,
        5
      );
    });

    it('should throw HttpException if message is missing', async () => {
      const botId = 1;
      const sendMessageDto = { message: '' };

      await expect(
        controller.sendMessage(botId, sendMessageDto, mockUser)
      ).rejects.toThrow(HttpException);
      await expect(
        controller.sendMessage(botId, sendMessageDto, mockUser)
      ).rejects.toThrow('Message is required');
    });

    it('should throw HttpException if message is not a string', async () => {
      const botId = 1;
      const sendMessageDto = { message: null as unknown as string };

      await expect(
        controller.sendMessage(botId, sendMessageDto, mockUser)
      ).rejects.toThrow(HttpException);
      await expect(
        controller.sendMessage(botId, sendMessageDto, mockUser)
      ).rejects.toThrow('Message is required');
    });

    it('should throw HttpException for invalid API key', async () => {
      const botId = 1;
      const sendMessageDto = { message: 'Hello' };
      const error = { message: 'Invalid API key', status: 401 };

      mockChatService.sendMessage.mockRejectedValue(error);

      await expect(
        controller.sendMessage(botId, sendMessageDto, mockUser)
      ).rejects.toThrow(HttpException);
      await expect(
        controller.sendMessage(botId, sendMessageDto, mockUser)
      ).rejects.toThrow('Invalid API key. Please check your .env file.');
    });

    it('should throw HttpException on service error', async () => {
      const agentId = 1;
      const sendMessageDto = { message: 'Hello' };
      const error = new HttpException('Agent not found', HttpStatus.NOT_FOUND);

      mockChatService.sendMessage.mockRejectedValue(error);

      await expect(
        controller.sendMessage(agentId, sendMessageDto, mockUser)
      ).rejects.toThrow(HttpException);
      await expect(
        controller.sendMessage(agentId, sendMessageDto, mockUser)
      ).rejects.toThrow('Agent not found');
    });
  });

  describe('deleteSession', () => {
    it('should delete a session', async () => {
      const agentId = 1;
      const sessionId = 1;

      mockChatService.deleteSession.mockResolvedValue(undefined);

      const result = await controller.deleteSession(
        agentId,
        sessionId,
        mockUser
      );

      expect(result).toEqual({ success: true });
      expect(chatService.deleteSession).toHaveBeenCalledWith(
        agentId,
        sessionId,
        mockUser.id
      );
    });

    it('should throw HttpException on service error', async () => {
      const agentId = 1;
      const sessionId = 1;
      const error = new HttpException(
        'Session not found',
        HttpStatus.NOT_FOUND
      );

      mockChatService.deleteSession.mockRejectedValue(error);

      await expect(
        controller.deleteSession(agentId, sessionId, mockUser)
      ).rejects.toThrow(HttpException);
      await expect(
        controller.deleteSession(agentId, sessionId, mockUser)
      ).rejects.toThrow('Session not found');
    });
  });
});
