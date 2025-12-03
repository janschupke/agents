import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { AgentController } from './agent.controller';
import { AgentService } from './agent.service';
import { AuthenticatedUser } from '../common/types/auth.types';

describe('AgentController', () => {
  let controller: AgentController;
  let agentService: AgentService;

  const mockAgentService = {
    findAll: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
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
      controllers: [AgentController],
      providers: [
        {
          provide: AgentService,
          useValue: mockAgentService,
        },
      ],
    }).compile();

    controller = module.get<AgentController>(AgentController);
    agentService = module.get<AgentService>(AgentService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getAllAgents', () => {
    it('should return all agents', async () => {
      const mockAgents = [
        { id: 1, name: 'Agent 1', description: 'Description 1' },
        { id: 2, name: 'Agent 2', description: 'Description 2' },
      ];

      mockAgentService.findAll.mockResolvedValue(mockAgents);

      const result = await controller.getAllAgents(mockUser);

      expect(result).toEqual(mockAgents);
      expect(agentService.findAll).toHaveBeenCalledWith(mockUser.id);
    });

    it('should throw HttpException on service error', async () => {
      const error = new HttpException(
        'Service error',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
      mockAgentService.findAll.mockRejectedValue(error);

      await expect(controller.getAllAgents(mockUser)).rejects.toThrow(
        HttpException
      );
      await expect(controller.getAllAgents(mockUser)).rejects.toThrow(
        'Service error'
      );
    });

    it('should handle unknown errors', async () => {
      const error = new Error('Unknown error');
      mockAgentService.findAll.mockRejectedValue(error);

      // In production, the global exception filter would convert this to HttpException
      // In tests without the filter, the raw Error is thrown
      await expect(controller.getAllAgents(mockUser)).rejects.toThrow(Error);
      await expect(controller.getAllAgents(mockUser)).rejects.toThrow(
        'Unknown error'
      );
    });
  });

  describe('getAgent', () => {
    it('should return an agent by id', async () => {
      const agentId = 1;
      const mockAgent = {
        id: agentId,
        name: 'Test Agent',
        description: 'Test Description',
      };

      mockAgentService.findById.mockResolvedValue(mockAgent);

      const result = await controller.getAgent(agentId, mockUser);

      expect(result).toEqual(mockAgent);
      expect(agentService.findById).toHaveBeenCalledWith(agentId, mockUser.id);
    });

    it('should throw HttpException on service error', async () => {
      const agentId = 1;
      const error = new HttpException('Agent not found', HttpStatus.NOT_FOUND);
      mockAgentService.findById.mockRejectedValue(error);

      await expect(controller.getAgent(agentId, mockUser)).rejects.toThrow(
        HttpException
      );
      await expect(controller.getAgent(agentId, mockUser)).rejects.toThrow(
        'Agent not found'
      );
    });
  });

  describe('createAgent', () => {
    it('should create a new agent', async () => {
      const createDto = {
        name: 'New Agent',
        description: 'New Description',
        configs: {
          temperature: 0.7,
          system_prompt: 'You are helpful',
        },
      };
      const mockAgent = { id: 1, ...createDto };

      mockAgentService.create.mockResolvedValue(mockAgent);

      const result = await controller.createAgent(createDto, mockUser);

      expect(result).toEqual(mockAgent);
      expect(agentService.create).toHaveBeenCalledWith(
        mockUser.id,
        createDto.name,
        createDto.description,
        undefined, // avatarUrl
        expect.objectContaining({
          temperature: createDto.configs.temperature,
          system_prompt: createDto.configs.system_prompt,
        })
      );
    });

    it('should create an agent without configs', async () => {
      const createDto = {
        name: 'New Agent',
        description: 'New Description',
      };
      const mockAgent = { id: 1, ...createDto };

      mockAgentService.create.mockResolvedValue(mockAgent);

      const result = await controller.createAgent(createDto, mockUser);

      expect(result).toEqual(mockAgent);
      expect(agentService.create).toHaveBeenCalledWith(
        mockUser.id,
        createDto.name,
        createDto.description,
        undefined, // avatarUrl
        undefined // configs
      );
    });

    it('should throw HttpException on service error', async () => {
      const createDto = { name: 'New Agent' };
      const error = new HttpException(
        'Agent name already exists',
        HttpStatus.CONFLICT
      );
      mockAgentService.create.mockRejectedValue(error);

      await expect(controller.createAgent(createDto, mockUser)).rejects.toThrow(
        HttpException
      );
      await expect(controller.createAgent(createDto, mockUser)).rejects.toThrow(
        'Agent name already exists'
      );
    });
  });

  describe('updateAgent', () => {
    it('should update an agent', async () => {
      const agentId = 1;
      const updateDto = {
        name: 'Updated Agent',
        description: 'Updated Description',
        configs: {
          temperature: 0.8,
        },
      };
      const mockAgent = { id: agentId, ...updateDto };

      mockAgentService.update.mockResolvedValue(mockAgent);

      const result = await controller.updateAgent(agentId, updateDto, mockUser);

      expect(result).toEqual(mockAgent);
      expect(agentService.update).toHaveBeenCalledWith(
        agentId,
        mockUser.id,
        updateDto.name,
        updateDto.description,
        undefined, // avatarUrl
        expect.objectContaining({
          temperature: updateDto.configs.temperature,
        })
      );
    });

    it('should throw HttpException on service error', async () => {
      const agentId = 1;
      const updateDto = { name: 'Updated Agent' };
      const error = new HttpException('Agent not found', HttpStatus.NOT_FOUND);
      mockAgentService.update.mockRejectedValue(error);

      await expect(
        controller.updateAgent(agentId, updateDto, mockUser)
      ).rejects.toThrow(HttpException);
      await expect(
        controller.updateAgent(agentId, updateDto, mockUser)
      ).rejects.toThrow('Agent not found');
    });
  });

  describe('deleteAgent', () => {
    it('should delete an agent', async () => {
      const agentId = 1;

      mockAgentService.delete.mockResolvedValue(undefined);

      const result = await controller.deleteAgent(agentId, mockUser);

      expect(result).toEqual({ success: true });
      expect(agentService.delete).toHaveBeenCalledWith(agentId, mockUser.id);
    });

    it('should throw HttpException on service error', async () => {
      const agentId = 1;
      const error = new HttpException('Agent not found', HttpStatus.NOT_FOUND);
      mockAgentService.delete.mockRejectedValue(error);

      await expect(controller.deleteAgent(agentId, mockUser)).rejects.toThrow(
        HttpException
      );
      await expect(controller.deleteAgent(agentId, mockUser)).rejects.toThrow(
        'Agent not found'
      );
    });
  });
});
