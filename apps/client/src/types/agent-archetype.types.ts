import { AgentType } from './agent.types';

export interface AgentArchetype {
  id: number;
  name: string;
  description?: string;
  avatarUrl?: string;
  agentType?: AgentType;
  language?: string;
  createdAt: string;
  updatedAt: string;
  configs?: Record<string, unknown>;
}

export interface CreateAgentArchetypeRequest {
  name: string;
  description?: string;
  avatarUrl?: string;
  agentType?: AgentType;
  language?: string;
  configs?: Record<string, unknown>;
}

export interface UpdateAgentArchetypeRequest {
  name: string;
  description?: string;
  avatarUrl?: string;
  agentType?: AgentType;
  language?: string;
  configs?: Record<string, unknown>;
}
