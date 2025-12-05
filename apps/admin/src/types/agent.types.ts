export interface Agent {
  id: number;
  userId: string;
  name: string;
  description: string | null;
  avatarUrl: string | null;
  agentType: 'GENERAL' | 'LANGUAGE_ASSISTANT' | null;
  language: string | null;
  createdAt: string;
  memorySummary?: string | null;
  configs?: {
    temperature?: number;
    system_prompt?: string;
    behavior_rules?: string | unknown;
    model?: string;
    max_tokens?: number;
    response_length?: string;
    age?: number;
    gender?: string;
    personality?: string;
    sentiment?: string;
    interests?: string[];
    availability?: string;
  };
}

export interface AgentWithStats extends Agent {
  totalMessages: number;
  totalTokens: number;
}

export interface AgentMemory {
  id: number;
  agentId: number;
  userId: string;
  keyPoint: string;
  context?: {
    sessionId?: number;
    sessionName?: string | null;
    messageCount?: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface UpdateAgentRequest {
  name: string;
  description?: string;
  avatarUrl?: string;
  agentType?: 'GENERAL' | 'LANGUAGE_ASSISTANT';
  language?: string;
  configs?: Record<string, unknown>;
}

export interface UpdateMemoryRequest {
  keyPoint: string;
}
