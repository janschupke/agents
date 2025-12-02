import { apiManager } from './api-manager';
import { API_ENDPOINTS } from '../constants/api.constants';
import { AgentMemory } from '../types/chat.types';

export class MemoryService {
  /**
   * Get all memories for an agent
   */
  static async getMemories(agentId: number): Promise<AgentMemory[]> {
    return apiManager.get<AgentMemory[]>(API_ENDPOINTS.AGENTS.MEMORIES(agentId));
  }

  /**
   * Get a specific memory
   */
  static async getMemory(
    agentId: number,
    memoryId: number
  ): Promise<AgentMemory> {
    return apiManager.get<AgentMemory>(
      API_ENDPOINTS.AGENTS.MEMORY(agentId, memoryId)
    );
  }

  /**
   * Update a memory
   */
  static async updateMemory(
    agentId: number,
    memoryId: number,
    keyPoint: string
  ): Promise<AgentMemory> {
    return apiManager.put<AgentMemory>(
      API_ENDPOINTS.AGENTS.MEMORY(agentId, memoryId),
      { keyPoint }
    );
  }

  /**
   * Delete a memory
   */
  static async deleteMemory(agentId: number, memoryId: number): Promise<void> {
    return apiManager.delete(API_ENDPOINTS.AGENTS.MEMORY(agentId, memoryId));
  }

  /**
   * Manually trigger memory summarization
   */
  static async summarizeMemories(agentId: number): Promise<void> {
    return apiManager.post(API_ENDPOINTS.AGENTS.MEMORIES_SUMMARIZE(agentId), {});
  }
}
