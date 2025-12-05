import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AgentService } from './agent.service';
import { apiManager } from './api-manager';
import { API_ENDPOINTS } from '../constants/api.constants';
import type {
  Agent,
  AgentWithStats,
  AgentMemory,
  UpdateAgentRequest,
  UpdateMemoryRequest,
} from '../types/agent.types';

vi.mock('./api-manager');

describe('AgentService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAllAgents', () => {
    it('should fetch all agents from API', async () => {
      const mockAgents: AgentWithStats[] = [
        {
          id: 1,
          userId: 'user_1',
          name: 'Agent 1',
          description: 'Test agent',
          avatarUrl: null,
          agentType: null,
          language: null,
          createdAt: '2024-01-01T00:00:00.000Z',
          totalMessages: 0,
          totalTokens: 0,
        },
      ];

      vi.mocked(apiManager.get).mockResolvedValue(mockAgents);

      const result = await AgentService.getAllAgents();

      expect(apiManager.get).toHaveBeenCalledWith(
        API_ENDPOINTS.ADMIN_AGENTS.BASE
      );
      expect(result).toEqual(mockAgents);
    });
  });

  describe('getAgent', () => {
    it('should fetch agent by id from API', async () => {
      const agentId = 1;
      const mockAgent: Agent = {
        id: agentId,
        userId: 'user_1',
        name: 'Agent 1',
        description: 'Test agent',
        avatarUrl: null,
        agentType: null,
        language: null,
        createdAt: '2024-01-01T00:00:00.000Z',
      };

      vi.mocked(apiManager.get).mockResolvedValue(mockAgent);

      const result = await AgentService.getAgent(agentId);

      expect(apiManager.get).toHaveBeenCalledWith(
        API_ENDPOINTS.ADMIN_AGENTS.BY_ID(agentId)
      );
      expect(result).toEqual(mockAgent);
    });
  });

  describe('updateAgent', () => {
    it('should update agent via API', async () => {
      const agentId = 1;
      const updateData: UpdateAgentRequest = {
        name: 'Updated Agent',
        description: 'Updated description',
      };
      const updatedAgent: Agent = {
        id: agentId,
        userId: 'user_1',
        name: updateData.name,
        description: updateData.description || null,
        avatarUrl: updateData.avatarUrl || null,
        agentType: updateData.agentType || null,
        language: updateData.language || null,
        createdAt: '2024-01-01T00:00:00.000Z',
      };

      vi.mocked(apiManager.put).mockResolvedValue(updatedAgent);

      const result = await AgentService.updateAgent(agentId, updateData);

      expect(apiManager.put).toHaveBeenCalledWith(
        API_ENDPOINTS.ADMIN_AGENTS.BY_ID(agentId),
        updateData
      );
      expect(result).toEqual(updatedAgent);
    });
  });

  describe('deleteAgent', () => {
    it('should delete agent via API', async () => {
      const agentId = 1;

      vi.mocked(apiManager.delete).mockResolvedValue(undefined);

      await AgentService.deleteAgent(agentId);

      expect(apiManager.delete).toHaveBeenCalledWith(
        API_ENDPOINTS.ADMIN_AGENTS.BY_ID(agentId)
      );
    });
  });

  describe('getAgentMemories', () => {
    it('should fetch agent memories from API', async () => {
      const agentId = 1;
      const mockMemories: AgentMemory[] = [
        {
          id: 1,
          agentId: agentId,
          userId: 'user_1',
          keyPoint: 'Memory key point',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      ];

      vi.mocked(apiManager.get).mockResolvedValue(mockMemories);

      const result = await AgentService.getAgentMemories(agentId);

      expect(apiManager.get).toHaveBeenCalledWith(
        API_ENDPOINTS.ADMIN_AGENTS.MEMORIES(agentId)
      );
      expect(result).toEqual(mockMemories);
    });
  });

  describe('updateMemory', () => {
    it('should update memory via API', async () => {
      const agentId = 1;
      const memoryId = 1;
      const updateData: UpdateMemoryRequest = {
        keyPoint: 'Updated memory key point',
      };
      const updatedMemory: AgentMemory = {
        id: memoryId,
        agentId: agentId,
        userId: 'user_1',
        keyPoint: updateData.keyPoint,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-02T00:00:00.000Z',
      };

      vi.mocked(apiManager.put).mockResolvedValue(updatedMemory);

      const result = await AgentService.updateMemory(
        agentId,
        memoryId,
        updateData
      );

      expect(apiManager.put).toHaveBeenCalledWith(
        API_ENDPOINTS.ADMIN_AGENTS.MEMORY(agentId, memoryId),
        updateData
      );
      expect(result).toEqual(updatedMemory);
    });
  });

  describe('deleteMemory', () => {
    it('should delete memory via API', async () => {
      const agentId = 1;
      const memoryId = 1;

      vi.mocked(apiManager.delete).mockResolvedValue(undefined);

      await AgentService.deleteMemory(agentId, memoryId);

      expect(apiManager.delete).toHaveBeenCalledWith(
        API_ENDPOINTS.ADMIN_AGENTS.MEMORY(agentId, memoryId)
      );
    });
  });
});
