import { apiManager } from './api-manager';
import { API_ENDPOINTS } from '../constants/api.constants';
import { AgentMemory } from '../types/chat.types';

export class MemoryService {
  /**
   * Get all memories for a bot
   */
  static async getMemories(botId: number): Promise<AgentMemory[]> {
    return apiManager.get<AgentMemory[]>(API_ENDPOINTS.BOTS.MEMORIES(botId));
  }

  /**
   * Get a specific memory
   */
  static async getMemory(
    botId: number,
    memoryId: number
  ): Promise<AgentMemory> {
    return apiManager.get<AgentMemory>(
      API_ENDPOINTS.BOTS.MEMORY(botId, memoryId)
    );
  }

  /**
   * Update a memory
   */
  static async updateMemory(
    botId: number,
    memoryId: number,
    keyPoint: string
  ): Promise<AgentMemory> {
    return apiManager.put<AgentMemory>(
      API_ENDPOINTS.BOTS.MEMORY(botId, memoryId),
      { keyPoint }
    );
  }

  /**
   * Delete a memory
   */
  static async deleteMemory(botId: number, memoryId: number): Promise<void> {
    return apiManager.delete(API_ENDPOINTS.BOTS.MEMORY(botId, memoryId));
  }

  /**
   * Manually trigger memory summarization
   */
  static async summarizeMemories(botId: number): Promise<void> {
    return apiManager.post(API_ENDPOINTS.BOTS.MEMORIES_SUMMARIZE(botId), {});
  }
}
