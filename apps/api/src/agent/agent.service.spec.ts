import { Test, TestingModule } from '@nestjs/testing';
import { HttpException } from '@nestjs/common';
import { AgentService } from './agent.service';
import { AgentRepository } from './agent.repository';
import { SessionRepository } from '../session/session.repository';
import { AgentArchetypeService } from '../agent-archetype/agent-archetype.service';
import { AgentType } from '../common/enums/agent-type.enum';

describe('AgentService', () => {
  let service: AgentService;

  const mockAgentRepository = {
    findAll: jest.fn(),
    findById: jest.fn(),
    findByIdWithConfig: jest.fn(),
    findByIdAndUserId: jest.fn(),
    findByName: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateConfigs: jest.fn(),
    delete: jest.fn(),
    mergeAgentConfig: jest.fn(),
  };

  const mockSessionRepository = {
    findLatestByAgentId: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockAgentArchetypeService = {
    findById: jest.fn(),
    findAll: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AgentService,
        {
          provide: AgentRepository,
          useValue: mockAgentRepository,
        },
        {
          provide: SessionRepository,
          useValue: mockSessionRepository,
        },
        {
          provide: AgentArchetypeService,
          useValue: mockAgentArchetypeService,
        },
      ],
    }).compile();

    service = module.get<AgentService>(AgentService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all agents for a user', async () => {
      const userId = 'user-123';
      const mockAgents = [
        { id: 1, name: 'Agent 1', description: 'Description 1', userId },
        { id: 2, name: 'Agent 2', description: 'Description 2', userId },
      ];

      mockAgentRepository.findAll.mockResolvedValue(mockAgents);

      const result = await service.findAll(userId);

      expect(result).toEqual(mockAgents);
      expect(mockAgentRepository.findAll).toHaveBeenCalledWith(userId);
    });
  });

  describe('findById', () => {
    it('should return an agent by id', async () => {
      const agentId = 1;
      const userId = 'user-123';
      const mockAgent = {
        id: agentId,
        name: 'Test Agent',
        description: 'Test Description',
        userId,
      };
      const mockAgentWithConfig = {
        ...mockAgent,
        configs: [{ key: 'temperature', value: '0.7' }],
      };

      mockAgentRepository.findByIdWithConfig.mockResolvedValue(
        mockAgentWithConfig
      );
      mockAgentRepository.findById.mockResolvedValue(mockAgent);

      const result = await service.findById(agentId, userId);

      expect(result).toEqual({
        ...mockAgent,
        configs: mockAgentWithConfig.configs,
      });
      expect(mockAgentRepository.findByIdWithConfig).toHaveBeenCalledWith(
        agentId,
        userId
      );
      expect(mockAgentRepository.findById).toHaveBeenCalledWith(agentId);
    });

    it('should throw HttpException if agent not found', async () => {
      const agentId = 1;
      const userId = 'user-123';

      mockAgentRepository.findByIdWithConfig.mockResolvedValue(null);

      await expect(service.findById(agentId, userId)).rejects.toThrow(
        HttpException
      );
      await expect(service.findById(agentId, userId)).rejects.toThrow(
        `Agent with ID ${agentId} not found`
      );
    });
  });

  describe('create', () => {
    it('should create a new agent', async () => {
      const userId = 'user-123';
      const name = 'New Agent';
      const description = 'New Description';
      const configs = { temperature: 0.7 };
      const mockAgent = {
        id: 1,
        name,
        description,
        userId,
      };

      mockAgentRepository.findByName.mockResolvedValue(null);
      mockAgentRepository.create.mockResolvedValue(mockAgent);
      mockSessionRepository.create.mockResolvedValue({
        id: 1,
        userId,
        agentId: mockAgent.id,
        sessionName: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastMessageAt: null,
      });

      const result = await service.create(
        userId,
        name,
        description,
        undefined,
        undefined,
        undefined,
        configs
      );

      expect(result).toEqual(mockAgent);
      expect(mockAgentRepository.findByName).toHaveBeenCalledWith(name, userId);
      expect(mockAgentRepository.create).toHaveBeenCalledWith(
        userId,
        name,
        description,
        undefined, // avatarUrl
        AgentType.GENERAL, // agentType (default)
        undefined // language
      );
      expect(mockAgentRepository.updateConfigs).toHaveBeenCalledWith(
        mockAgent.id,
        configs
      );
    });

    it('should create an agent without configs', async () => {
      const userId = 'user-123';
      const name = 'New Agent';
      const mockAgent = {
        id: 1,
        name,
        description: null,
        userId,
        avatarUrl: null,
        agentType: AgentType.GENERAL,
        language: null,
        createdAt: new Date(),
      };

      mockAgentRepository.findByName.mockResolvedValue(null);
      mockAgentRepository.create.mockResolvedValue(mockAgent);
      mockSessionRepository.create.mockResolvedValue({
        id: 1,
        userId,
        agentId: mockAgent.id,
        sessionName: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastMessageAt: null,
      });

      const result = await service.create(userId, name);

      expect(result).toEqual({
        id: mockAgent.id,
        userId: mockAgent.userId,
        name: mockAgent.name,
        description: mockAgent.description,
        avatarUrl: null,
        agentType: AgentType.GENERAL,
        language: null,
        createdAt: expect.any(Date),
      });
      expect(mockAgentRepository.updateConfigs).not.toHaveBeenCalled();
      expect(mockSessionRepository.create).toHaveBeenCalledWith(
        userId,
        mockAgent.id
      );
    });

    it('should throw HttpException if name is empty', async () => {
      const userId = 'user-123';
      const name = '';

      await expect(service.create(userId, name)).rejects.toThrow(HttpException);
      await expect(service.create(userId, name)).rejects.toThrow(
        'Agent name is required'
      );
    });

    it('should throw HttpException if name is only whitespace', async () => {
      const userId = 'user-123';
      const name = '   ';

      await expect(service.create(userId, name)).rejects.toThrow(HttpException);
      await expect(service.create(userId, name)).rejects.toThrow(
        'Agent name is required'
      );
    });

    it('should throw HttpException if agent with same name exists', async () => {
      const userId = 'user-123';
      const name = 'Existing Agent';
      const existingAgent = { id: 1, name, userId };

      mockAgentRepository.findByName.mockResolvedValue(existingAgent);

      await expect(service.create(userId, name)).rejects.toThrow(HttpException);
      await expect(service.create(userId, name)).rejects.toThrow(
        'Agent with this name already exists'
      );
    });
  });

  describe('update', () => {
    it('should update an agent', async () => {
      const agentId = 1;
      const userId = 'user-123';
      const name = 'Updated Agent';
      const description = 'Updated Description';
      const configs = { temperature: 0.8 };
      const existingAgent = {
        id: agentId,
        name: 'Old Agent',
        description: 'Old Description',
        userId,
      };
      const updatedAgent = {
        ...existingAgent,
        name,
        description,
      };

      mockAgentRepository.findByIdAndUserId.mockResolvedValue(existingAgent);
      mockAgentRepository.findByName.mockResolvedValue(null);
      mockAgentRepository.update.mockResolvedValue(updatedAgent);

      const result = await service.update(
        agentId,
        userId,
        name,
        description,
        undefined,
        undefined,
        undefined,
        configs
      );

      expect(result).toEqual(updatedAgent);
      expect(mockAgentRepository.findByIdAndUserId).toHaveBeenCalledWith(
        agentId,
        userId
      );
      expect(mockAgentRepository.update).toHaveBeenCalledWith(
        agentId,
        userId,
        name,
        description,
        undefined, // avatarUrl
        undefined, // agentType
        undefined // language
      );
      expect(mockAgentRepository.updateConfigs).toHaveBeenCalledWith(
        agentId,
        configs
      );
    });

    it('should throw HttpException if agent not found', async () => {
      const agentId = 1;
      const userId = 'user-123';
      const name = 'Updated Agent';

      mockAgentRepository.findByIdAndUserId.mockResolvedValue(null);

      await expect(service.update(agentId, userId, name)).rejects.toThrow(
        HttpException
      );
      await expect(service.update(agentId, userId, name)).rejects.toThrow(
        `Agent with ID ${agentId} not found`
      );
    });

    it('should throw HttpException if name is empty', async () => {
      const agentId = 1;
      const userId = 'user-123';
      const name = '';
      const existingAgent = { id: agentId, name: 'Old Agent', userId };

      mockAgentRepository.findByIdAndUserId.mockResolvedValue(existingAgent);

      await expect(service.update(agentId, userId, name)).rejects.toThrow(
        HttpException
      );
      await expect(service.update(agentId, userId, name)).rejects.toThrow(
        'Agent name is required'
      );
    });

    it('should throw HttpException if new name conflicts with another agent', async () => {
      const agentId = 1;
      const userId = 'user-123';
      const name = 'Conflicting Agent';
      const existingAgent = { id: agentId, name: 'Old Agent', userId };
      const conflictingAgent = { id: 2, name, userId };

      mockAgentRepository.findByIdAndUserId.mockResolvedValue(existingAgent);
      mockAgentRepository.findByName.mockResolvedValue(conflictingAgent);

      await expect(service.update(agentId, userId, name)).rejects.toThrow(
        HttpException
      );
      await expect(service.update(agentId, userId, name)).rejects.toThrow(
        'Agent with this name already exists'
      );
    });
  });

  describe('delete', () => {
    it('should delete an agent', async () => {
      const agentId = 1;
      const userId = 'user-123';
      const mockAgent = { id: agentId, name: 'Test Agent', userId };

      mockAgentRepository.findByIdAndUserId.mockResolvedValue(mockAgent);
      mockAgentRepository.delete.mockResolvedValue(undefined);

      await service.delete(agentId, userId);

      expect(mockAgentRepository.findByIdAndUserId).toHaveBeenCalledWith(
        agentId,
        userId
      );
      expect(mockAgentRepository.delete).toHaveBeenCalledWith(agentId, userId);
    });

    it('should throw HttpException if agent not found', async () => {
      const agentId = 1;
      const userId = 'user-123';

      mockAgentRepository.findByIdAndUserId.mockResolvedValue(null);

      await expect(service.delete(agentId, userId)).rejects.toThrow(
        HttpException
      );
      await expect(service.delete(agentId, userId)).rejects.toThrow(
        `Agent with ID ${agentId} not found`
      );
    });
  });
});
