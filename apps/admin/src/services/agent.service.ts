import { apiManager } from './api-manager';
import { API_ENDPOINTS } from '../constants/api.constants';
import {
  Agent,
  AgentWithStats,
  AgentMemory,
  UpdateAgentRequest,
  UpdateMemoryRequest,
} from '../types/agent.types';

export class AgentService {
  static async getAllAgents(): Promise<AgentWithStats[]> {
    return apiManager.get<AgentWithStats[]>(API_ENDPOINTS.ADMIN_AGENTS.BASE);
  }

  static async getAgent(id: number): Promise<Agent> {
    return apiManager.get<Agent>(API_ENDPOINTS.ADMIN_AGENTS.BY_ID(id));
  }

  static async updateAgent(
    id: number,
    data: UpdateAgentRequest
  ): Promise<Agent> {
    return apiManager.put<Agent>(API_ENDPOINTS.ADMIN_AGENTS.BY_ID(id), data);
  }

  static async deleteAgent(id: number): Promise<void> {
    return apiManager.delete(API_ENDPOINTS.ADMIN_AGENTS.BY_ID(id));
  }

  static async getAgentMemories(agentId: number): Promise<AgentMemory[]> {
    return apiManager.get<AgentMemory[]>(
      API_ENDPOINTS.ADMIN_AGENTS.MEMORIES(agentId)
    );
  }

  static async updateMemory(
    agentId: number,
    memoryId: number,
    data: UpdateMemoryRequest
  ): Promise<AgentMemory> {
    return apiManager.put<AgentMemory>(
      API_ENDPOINTS.ADMIN_AGENTS.MEMORY(agentId, memoryId),
      data
    );
  }

  static async deleteMemory(agentId: number, memoryId: number): Promise<void> {
    return apiManager.delete(
      API_ENDPOINTS.ADMIN_AGENTS.MEMORY(agentId, memoryId)
    );
  }
}
