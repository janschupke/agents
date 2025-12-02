export interface AgentWithConfig {
  id: number;
  name: string;
  description: string | null;
  avatarUrl: string | null;
  configs: Record<string, unknown>;
}

export interface AgentConfig {
  temperature?: number;
  system_prompt?: string;
  behavior_rules?: string | string[] | { rules: string[] };
  model?: string;
  max_tokens?: number;
}

export interface AgentResponse {
  id: number;
  userId: string;
  name: string;
  description: string | null;
  avatarUrl: string | null;
  createdAt: Date;
  configs?: Record<string, unknown>;
}

export interface EmbeddingResponse {
  id: number;
  sessionId: number;
  chunk: string;
  createdAt: Date;
}
