import { AgentType } from '../enums/agent-type.enum';
import { AgentConfig } from '../types/config.types';

export interface AgentWithConfig {
  id: number;
  name: string;
  description: string | null;
  avatarUrl: string | null;
  agentType: AgentType | null;
  language: string | null;
  configs: AgentConfig;
}

export interface AgentResponse {
  id: number;
  userId: string;
  name: string;
  description: string | null;
  avatarUrl: string | null;
  agentType: AgentType | null;
  language: string | null;
  createdAt: Date;
  configs?: AgentConfig;
  memorySummary?: string | null;
}
