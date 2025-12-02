import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { AgentMemoryController } from './agent-memory.controller';
import { AgentMemoryService } from './agent-memory.service';
import { AgentMemoryRepository } from './agent-memory.repository';
import { ApiCredentialsService } from '../api-credentials/api-credentials.service';
import { ERROR_MESSAGES, MAGIC_STRINGS } from '../common/constants/error-messages.constants.js';

describe('AgentMemoryController', () => {
  let controller: AgentMemoryController;
  let memoryService: jest.Mocked<AgentMemoryService>;
  let memoryRepository: jest.Mocked<AgentMemoryRepository>;
  let apiCredentialsService: jest.Mocked<ApiCredentialsService>;

  const mockMemoryService = {
    summarizeMemories: jest.fn(),
  };

  const mockMemoryRepository = {
    findAllByAgentId: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockApiCredentialsService = {
    getApiKey: jest.fn(),
  };

  const mockUser: { id: string; roles: string[] } = {
    id: 'user-1',
    roles: ['user'],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AgentMemoryController],
      providers: [
        {
          provide: AgentMemoryService,
          useValue: mockMemoryService,
        },
        {
          provide: AgentMemoryRepository,
          useValue: mockMemoryRepository,
        },
        {
          provide: ApiCredentialsService,
          useValue: mockApiCredentialsService,
        },
      ],
    }).compile();

    controller = module.get<AgentMemoryController>(AgentMemoryController);
    memoryService = module.get(AgentMemoryService);
    memoryRepository = module.get(AgentMemoryRepository);
    apiCredentialsService = module.get(ApiCredentialsService);

    jest.clearAllMocks();
  });

  describe('getMemories', () => {
    it('should return memories for agent', async () => {
      const agentId = 1;
      const mockMemories = [
        {
          id: 1,
          agentId,
          userId: 'user-1',
          keyPoint: 'Memory 1',
          context: { sessionId: 1 },
          vectorEmbedding: null,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          updateCount: 0,
        },
      ];

      memoryRepository.findAllByAgentId.mockResolvedValue(mockMemories);

      const result = await controller.getMemories(agentId, mockUser);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 1,
        agentId,
        userId: 'user-1',
        keyPoint: 'Memory 1',
        context: { sessionId: 1 },
        createdAt: mockMemories[0].createdAt.toISOString(),
        updatedAt: mockMemories[0].updatedAt.toISOString(),
      });
      expect(memoryRepository.findAllByAgentId).toHaveBeenCalledWith(
        agentId,
        'user-1',
        undefined
      );
    });

    it('should respect limit parameter', async () => {
      const agentId = 1;
      memoryRepository.findAllByAgentId.mockResolvedValue([]);

      await controller.getMemories(agentId, mockUser, '10');

      expect(memoryRepository.findAllByAgentId).toHaveBeenCalledWith(
        agentId,
        'user-1',
        10
      );
    });
  });

  describe('getMemory', () => {
    it('should return specific memory', async () => {
      const agentId = 1;
      const memoryId = 1;
      const mockMemories = [
        {
          id: memoryId,
          agentId,
          userId: 'user-1',
          keyPoint: 'Memory 1',
          context: { sessionId: 1 },
          vectorEmbedding: null,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          updateCount: 0,
        },
      ];

      memoryRepository.findAllByAgentId.mockResolvedValue(mockMemories);

      const result = await controller.getMemory(agentId, memoryId, mockUser);

      expect(result).toEqual({
        id: memoryId,
        agentId,
        userId: 'user-1',
        keyPoint: 'Memory 1',
        context: { sessionId: 1 },
        createdAt: mockMemories[0].createdAt.toISOString(),
        updatedAt: mockMemories[0].updatedAt.toISOString(),
      });
    });

    it('should throw error if memory not found', async () => {
      const agentId = 1;
      const memoryId = 999;

      memoryRepository.findAllByAgentId.mockResolvedValue([]);

      await expect(
        controller.getMemory(agentId, memoryId, mockUser)
      ).rejects.toThrow(HttpException);
      await expect(
        controller.getMemory(agentId, memoryId, mockUser)
      ).rejects.toThrow(ERROR_MESSAGES.MEMORY_NOT_FOUND);
    });
  });

  describe('updateMemory', () => {
    it('should update memory', async () => {
      const agentId = 1;
      const memoryId = 1;
      const updateDto = { keyPoint: 'Updated memory' };
      const existingMemory = {
        id: memoryId,
        agentId,
        userId: 'user-1',
        keyPoint: 'Original',
        context: {},
        vectorEmbedding: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        updateCount: 0,
      };
      const updatedMemory = {
        ...existingMemory,
        keyPoint: 'Updated memory',
      };

      memoryRepository.findAllByAgentId.mockResolvedValue([existingMemory]);
      memoryRepository.update.mockResolvedValue(updatedMemory);

      const result = await controller.updateMemory(
        agentId,
        memoryId,
        updateDto,
        mockUser
      );

      expect(result.keyPoint).toBe('Updated memory');
      expect(memoryRepository.update).toHaveBeenCalledWith(
        memoryId,
        'Updated memory'
      );
    });

    it('should throw error if memory not found', async () => {
      const agentId = 1;
      const memoryId = 999;
      const updateDto = { keyPoint: 'Updated' };

      memoryRepository.findAllByAgentId.mockResolvedValue([]);

      await expect(
        controller.updateMemory(agentId, memoryId, updateDto, mockUser)
      ).rejects.toThrow(HttpException);
      await expect(
        controller.updateMemory(agentId, memoryId, updateDto, mockUser)
      ).rejects.toThrow(ERROR_MESSAGES.MEMORY_NOT_FOUND);
    });
  });

  describe('deleteMemory', () => {
    it('should delete memory', async () => {
      const agentId = 1;
      const memoryId = 1;
      const existingMemory = {
        id: memoryId,
        agentId,
        userId: 'user-1',
        keyPoint: 'Memory',
        context: {},
        vectorEmbedding: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        updateCount: 0,
      };

      memoryRepository.findAllByAgentId.mockResolvedValue([existingMemory]);
      memoryRepository.delete.mockResolvedValue(undefined);

      await controller.deleteMemory(agentId, memoryId, mockUser);

      expect(memoryRepository.delete).toHaveBeenCalledWith(memoryId);
    });

    it('should throw error if memory not found', async () => {
      const agentId = 1;
      const memoryId = 999;

      memoryRepository.findAllByAgentId.mockResolvedValue([]);

      await expect(
        controller.deleteMemory(agentId, memoryId, mockUser)
      ).rejects.toThrow(HttpException);
      await expect(
        controller.deleteMemory(agentId, memoryId, mockUser)
      ).rejects.toThrow(ERROR_MESSAGES.MEMORY_NOT_FOUND);
    });
  });

  describe('summarizeMemories', () => {
    it('should summarize memories', async () => {
      const agentId = 1;
      const apiKey = 'api-key';

      apiCredentialsService.getApiKey.mockResolvedValue(apiKey);
      memoryService.summarizeMemories.mockResolvedValue(undefined);

      const result = await controller.summarizeMemories(agentId, mockUser);

      expect(result).toEqual({ message: 'Memories summarized successfully' });
      expect(apiCredentialsService.getApiKey).toHaveBeenCalledWith(
        'user-1',
        MAGIC_STRINGS.OPENAI_PROVIDER
      );
      expect(memoryService.summarizeMemories).toHaveBeenCalledWith(
        agentId,
        'user-1',
        apiKey
      );
    });

    it('should throw error if API key not found', async () => {
      const agentId = 1;

      apiCredentialsService.getApiKey.mockResolvedValue(null);

      await expect(
        controller.summarizeMemories(agentId, mockUser)
      ).rejects.toThrow(HttpException);
      await expect(
        controller.summarizeMemories(agentId, mockUser)
      ).rejects.toThrow(ERROR_MESSAGES.OPENAI_API_KEY_REQUIRED);
    });
  });
});
