import { Test, TestingModule } from '@nestjs/testing';
import { HttpException } from '@nestjs/common';
import { SessionService } from './session.service';
import { AgentRepository } from '../agent/agent.repository';
import { SessionRepository } from './session.repository';

describe('SessionService', () => {
  let service: SessionService;
  let agentRepository: jest.Mocked<AgentRepository>;
  let sessionRepository: jest.Mocked<SessionRepository>;

  const mockAgentRepository = {
    findByIdWithConfig: jest.fn(),
    findByIdAndUserId: jest.fn(),
  };

  const mockSessionRepository = {
    findAllByAgentId: jest.fn(),
    create: jest.fn(),
    findByIdAndUserId: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionService,
        {
          provide: AgentRepository,
          useValue: mockAgentRepository,
        },
        {
          provide: SessionRepository,
          useValue: mockSessionRepository,
        },
      ],
    }).compile();

    service = module.get<SessionService>(SessionService);
    agentRepository = module.get(AgentRepository);
    sessionRepository = module.get(SessionRepository);

    jest.clearAllMocks();
  });

  describe('getSessions', () => {
    it('should return sessions for agent and user', async () => {
      const agentId = 1;
      const userId = 'user-1';
      const mockAgent = {
        id: agentId,
        name: 'Test Agent',
        description: 'Test',
        userId,
        avatarUrl: null,
        agentType: null,
        language: null,
        createdAt: new Date(),
        temperature: null,
        systemPrompt: null,
        behaviorRules: null,
        model: null,
        maxTokens: null,
        responseLength: null,
        age: null,
        gender: null,
        personality: null,
        sentiment: null,
        interests: null,
        availability: null,
        memorySummary: null,
        configs: {},
      };
      const mockSessions = [
        {
          id: 1,
          userId,
          agentId,
          sessionName: 'Session 1',
          createdAt: new Date(),
          updatedAt: new Date(),
          lastMessageAt: null,
        },
        {
          id: 2,
          userId,
          agentId,
          sessionName: 'Session 2',
          createdAt: new Date(),
          updatedAt: new Date(),
          lastMessageAt: null,
        },
      ];

      agentRepository.findByIdWithConfig.mockResolvedValue(mockAgent);
      sessionRepository.findAllByAgentId.mockResolvedValue(mockSessions);

      const result = await service.getSessions(agentId, userId);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 1,
        session_name: 'Session 1',
        createdAt: mockSessions[0].createdAt,
      });
      expect(agentRepository.findByIdWithConfig).toHaveBeenCalledWith(
        agentId,
        userId
      );
      expect(sessionRepository.findAllByAgentId).toHaveBeenCalledWith(
        agentId,
        userId
      );
    });

    it('should throw error if agent not found', async () => {
      const agentId = 1;
      const userId = 'user-1';

      agentRepository.findByIdWithConfig.mockResolvedValue(null);

      await expect(service.getSessions(agentId, userId)).rejects.toThrow(
        HttpException
      );
      await expect(service.getSessions(agentId, userId)).rejects.toThrow(
        `Agent with ID ${agentId} not found`
      );
    });
  });

  describe('createSession', () => {
    it('should create a new session', async () => {
      const agentId = 1;
      const userId = 'user-1';
      const mockAgent = {
        id: agentId,
        name: 'Test Agent',
        description: 'Test',
        userId,
        avatarUrl: null,
        agentType: null,
        language: null,
        createdAt: new Date(),
        temperature: null,
        systemPrompt: null,
        behaviorRules: null,
        model: null,
        maxTokens: null,
        responseLength: null,
        age: null,
        gender: null,
        personality: null,
        sentiment: null,
        interests: null,
        availability: null,
        memorySummary: null,
        configs: {},
      };
      const mockSession = {
        id: 1,
        userId,
        agentId,
        sessionName: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastMessageAt: null,
      };

      agentRepository.findByIdWithConfig.mockResolvedValue(mockAgent);
      sessionRepository.create.mockResolvedValue(mockSession);

      const result = await service.createSession(agentId, userId);

      expect(result).toEqual({
        id: 1,
        session_name: null,
        createdAt: mockSession.createdAt,
      });
      expect(sessionRepository.create).toHaveBeenCalledWith(userId, agentId);
    });

    it('should throw error if agent not found', async () => {
      const agentId = 1;
      const userId = 'user-1';

      agentRepository.findByIdWithConfig.mockResolvedValue(null);

      await expect(service.createSession(agentId, userId)).rejects.toThrow(
        HttpException
      );
      await expect(service.createSession(agentId, userId)).rejects.toThrow(
        `Agent with ID ${agentId} not found`
      );
    });
  });

  describe('updateSession', () => {
    it('should update session name', async () => {
      const agentId = 1;
      const sessionId = 1;
      const userId = 'user-1';
      const sessionName = 'Updated Session';
      const mockAgent = {
        id: agentId,
        name: 'Test Agent',
        description: 'Test',
        userId,
        avatarUrl: null,
        agentType: null,
        language: null,
        createdAt: new Date(),
        temperature: null,
        systemPrompt: null,
        behaviorRules: null,
        model: null,
        maxTokens: null,
        responseLength: null,
        age: null,
        gender: null,
        personality: null,
        sentiment: null,
        interests: null,
        availability: null,
        memorySummary: null,
      };
      const mockSession = {
        id: sessionId,
        userId,
        agentId,
        sessionName: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastMessageAt: null,
      };
      const updatedSession = {
        ...mockSession,
        sessionName,
      };

      agentRepository.findByIdAndUserId.mockResolvedValue(mockAgent);
      sessionRepository.findByIdAndUserId.mockResolvedValue(mockSession);
      sessionRepository.update.mockResolvedValue(updatedSession);

      const result = await service.updateSession(
        agentId,
        sessionId,
        userId,
        sessionName
      );

      expect(result).toEqual({
        id: sessionId,
        session_name: sessionName,
        createdAt: updatedSession.createdAt,
      });
      expect(sessionRepository.update).toHaveBeenCalledWith(
        sessionId,
        userId,
        sessionName
      );
    });

    it('should throw error if agent not found', async () => {
      const agentId = 1;
      const sessionId = 1;
      const userId = 'user-1';

      agentRepository.findByIdAndUserId.mockResolvedValue(null);

      await expect(
        service.updateSession(agentId, sessionId, userId)
      ).rejects.toThrow(HttpException);
      await expect(
        service.updateSession(agentId, sessionId, userId)
      ).rejects.toThrow(`Agent with ID ${agentId} not found`);
    });

    it('should throw error if session not found', async () => {
      const agentId = 1;
      const sessionId = 1;
      const userId = 'user-1';
      const mockAgent = {
        id: agentId,
        name: 'Test Agent',
        description: 'Test',
        userId,
        avatarUrl: null,
        agentType: null,
        language: null,
        createdAt: new Date(),
        temperature: null,
        systemPrompt: null,
        behaviorRules: null,
        model: null,
        maxTokens: null,
        responseLength: null,
        age: null,
        gender: null,
        personality: null,
        sentiment: null,
        interests: null,
        availability: null,
        memorySummary: null,
      };

      agentRepository.findByIdAndUserId.mockResolvedValue(mockAgent);
      sessionRepository.findByIdAndUserId.mockResolvedValue(null);

      await expect(
        service.updateSession(agentId, sessionId, userId)
      ).rejects.toThrow(HttpException);
      await expect(
        service.updateSession(agentId, sessionId, userId)
      ).rejects.toThrow(`Session with ID ${sessionId} not found`);
    });

    it('should throw error if session does not belong to agent', async () => {
      const agentId = 1;
      const sessionId = 1;
      const userId = 'user-1';
      const mockAgent = {
        id: agentId,
        name: 'Test Agent',
        description: 'Test',
        userId,
        avatarUrl: null,
        agentType: null,
        language: null,
        createdAt: new Date(),
        temperature: null,
        systemPrompt: null,
        behaviorRules: null,
        model: null,
        maxTokens: null,
        responseLength: null,
        age: null,
        gender: null,
        personality: null,
        sentiment: null,
        interests: null,
        availability: null,
        memorySummary: null,
      };
      const mockSession = {
        id: sessionId,
        userId,
        agentId: 999, // Different agent
        sessionName: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastMessageAt: null,
      };

      agentRepository.findByIdAndUserId.mockResolvedValue(mockAgent);
      sessionRepository.findByIdAndUserId.mockResolvedValue(mockSession);

      await expect(
        service.updateSession(agentId, sessionId, userId)
      ).rejects.toThrow(HttpException);
      await expect(
        service.updateSession(agentId, sessionId, userId)
      ).rejects.toThrow(`Session with ID ${sessionId} not found`);
    });
  });

  describe('deleteSession', () => {
    it('should delete session', async () => {
      const agentId = 1;
      const sessionId = 1;
      const userId = 'user-1';
      const mockAgent = {
        id: agentId,
        name: 'Test Agent',
        description: 'Test',
        userId,
        avatarUrl: null,
        agentType: null,
        language: null,
        createdAt: new Date(),
        temperature: null,
        systemPrompt: null,
        behaviorRules: null,
        model: null,
        maxTokens: null,
        responseLength: null,
        age: null,
        gender: null,
        personality: null,
        sentiment: null,
        interests: null,
        availability: null,
        memorySummary: null,
      };
      const mockSession = {
        id: sessionId,
        userId,
        agentId,
        sessionName: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastMessageAt: null,
      };

      agentRepository.findByIdAndUserId.mockResolvedValue(mockAgent);
      sessionRepository.findByIdAndUserId.mockResolvedValue(mockSession);
      sessionRepository.delete.mockResolvedValue(undefined);

      await service.deleteSession(agentId, sessionId, userId);

      expect(sessionRepository.delete).toHaveBeenCalledWith(sessionId, userId);
    });

    it('should throw error if agent not found', async () => {
      const agentId = 1;
      const sessionId = 1;
      const userId = 'user-1';

      agentRepository.findByIdAndUserId.mockResolvedValue(null);

      await expect(
        service.deleteSession(agentId, sessionId, userId)
      ).rejects.toThrow(HttpException);
      await expect(
        service.deleteSession(agentId, sessionId, userId)
      ).rejects.toThrow(`Agent with ID ${agentId} not found`);
    });

    it('should throw error if session not found', async () => {
      const agentId = 1;
      const sessionId = 1;
      const userId = 'user-1';
      const mockAgent = {
        id: agentId,
        name: 'Test Agent',
        description: 'Test',
        userId,
        avatarUrl: null,
        agentType: null,
        language: null,
        createdAt: new Date(),
        temperature: null,
        systemPrompt: null,
        behaviorRules: null,
        model: null,
        maxTokens: null,
        responseLength: null,
        age: null,
        gender: null,
        personality: null,
        sentiment: null,
        interests: null,
        availability: null,
        memorySummary: null,
      };

      agentRepository.findByIdAndUserId.mockResolvedValue(mockAgent);
      sessionRepository.findByIdAndUserId.mockResolvedValue(null);

      await expect(
        service.deleteSession(agentId, sessionId, userId)
      ).rejects.toThrow(HttpException);
      await expect(
        service.deleteSession(agentId, sessionId, userId)
      ).rejects.toThrow(`Session with ID ${sessionId} not found`);
    });

    it('should throw error if session does not belong to agent', async () => {
      const agentId = 1;
      const sessionId = 1;
      const userId = 'user-1';
      const mockAgent = {
        id: agentId,
        name: 'Test Agent',
        description: 'Test',
        userId,
        avatarUrl: null,
        agentType: null,
        language: null,
        createdAt: new Date(),
        temperature: null,
        systemPrompt: null,
        behaviorRules: null,
        model: null,
        maxTokens: null,
        responseLength: null,
        age: null,
        gender: null,
        personality: null,
        sentiment: null,
        interests: null,
        availability: null,
        memorySummary: null,
      };
      const mockSession = {
        id: sessionId,
        userId,
        agentId: 999, // Different agent
        sessionName: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastMessageAt: null,
      };

      agentRepository.findByIdAndUserId.mockResolvedValue(mockAgent);
      sessionRepository.findByIdAndUserId.mockResolvedValue(mockSession);

      await expect(
        service.deleteSession(agentId, sessionId, userId)
      ).rejects.toThrow(HttpException);
      await expect(
        service.deleteSession(agentId, sessionId, userId)
      ).rejects.toThrow(`Session with ID ${sessionId} not found`);
    });
  });
});
