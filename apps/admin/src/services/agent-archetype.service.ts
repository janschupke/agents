import { apiManager } from './api-manager';
import { API_ENDPOINTS } from '../constants/api.constants';
import {
  AgentArchetype,
  CreateAgentArchetypeRequest,
  UpdateAgentArchetypeRequest,
} from '../types/agent-archetype.types';

export class AgentArchetypeService {
  static async getAllArchetypes(): Promise<AgentArchetype[]> {
    return apiManager.get<AgentArchetype[]>(
      API_ENDPOINTS.AGENT_ARCHETYPES.BASE
    );
  }

  static async getArchetype(id: number): Promise<AgentArchetype> {
    return apiManager.get<AgentArchetype>(
      API_ENDPOINTS.AGENT_ARCHETYPES.BY_ID(id)
    );
  }

  static async createArchetype(
    data: CreateAgentArchetypeRequest
  ): Promise<AgentArchetype> {
    return apiManager.post<AgentArchetype>(
      API_ENDPOINTS.AGENT_ARCHETYPES.BASE,
      data
    );
  }

  static async updateArchetype(
    id: number,
    data: UpdateAgentArchetypeRequest
  ): Promise<AgentArchetype> {
    return apiManager.put<AgentArchetype>(
      API_ENDPOINTS.AGENT_ARCHETYPES.BY_ID(id),
      data
    );
  }

  static async deleteArchetype(id: number): Promise<void> {
    return apiManager.delete(API_ENDPOINTS.AGENT_ARCHETYPES.BY_ID(id));
  }
}
