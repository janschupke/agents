import { apiManager } from '../api/api-manager';
import { API_ENDPOINTS } from '../../constants/api.constants';
import {
  AgentArchetype,
  CreateAgentArchetypeRequest,
  UpdateAgentArchetypeRequest,
} from '../../types/agent-archetype.types';

export class AgentArchetypeService {
  /**
   * Get all agent archetypes
   */
  static async getAllArchetypes(): Promise<AgentArchetype[]> {
    return apiManager.get<AgentArchetype[]>(
      API_ENDPOINTS.AGENT_ARCHETYPES.BASE
    );
  }

  /**
   * Get an archetype by ID
   */
  static async getArchetype(archetypeId: number): Promise<AgentArchetype> {
    return apiManager.get<AgentArchetype>(
      API_ENDPOINTS.AGENT_ARCHETYPES.BY_ID(archetypeId)
    );
  }

  /**
   * Create a new archetype (admin only)
   */
  static async createArchetype(
    data: CreateAgentArchetypeRequest
  ): Promise<AgentArchetype> {
    return apiManager.post<AgentArchetype>(
      API_ENDPOINTS.AGENT_ARCHETYPES.BASE,
      data
    );
  }

  /**
   * Update an archetype (admin only)
   */
  static async updateArchetype(
    archetypeId: number,
    data: UpdateAgentArchetypeRequest
  ): Promise<AgentArchetype> {
    return apiManager.put<AgentArchetype>(
      API_ENDPOINTS.AGENT_ARCHETYPES.BY_ID(archetypeId),
      data
    );
  }

  /**
   * Delete an archetype (admin only)
   */
  static async deleteArchetype(archetypeId: number): Promise<void> {
    return apiManager.delete(
      API_ENDPOINTS.AGENT_ARCHETYPES.BY_ID(archetypeId)
    );
  }
}
