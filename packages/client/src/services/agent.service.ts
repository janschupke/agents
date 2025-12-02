import { apiManager } from './api-manager';
import { API_ENDPOINTS } from '../constants/api.constants';
import {
  Agent,
  CreateAgentRequest,
  UpdateAgentRequest,
} from '../types/chat.types';

export class AgentService {
  /**
   * Get all agents
   */
  static async getAllAgents(): Promise<Agent[]> {
    return apiManager.get<Agent[]>(API_ENDPOINTS.AGENTS.BASE);
  }

  /**
   * Get an agent by ID
   */
  static async getAgent(agentId: number): Promise<Agent> {
    return apiManager.get<Agent>(API_ENDPOINTS.AGENTS.BY_ID(agentId));
  }

  /**
   * Create a new agent
   */
  static async createAgent(data: CreateAgentRequest): Promise<Agent> {
    return apiManager.post<Agent>(API_ENDPOINTS.AGENTS.BASE, data);
  }

  /**
   * Update an agent
   */
  static async updateAgent(
    agentId: number,
    data: UpdateAgentRequest
  ): Promise<Agent> {
    return apiManager.put<Agent>(API_ENDPOINTS.AGENTS.BY_ID(agentId), data);
  }

  /**
   * Delete an agent (and all related data: sessions, messages, configs, memories)
   */
  static async deleteAgent(agentId: number): Promise<void> {
    return apiManager.delete(API_ENDPOINTS.AGENTS.BY_ID(agentId));
  }
}
