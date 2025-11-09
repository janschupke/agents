export interface BotWithConfig {
  id: number;
  name: string;
  description: string | null;
  configs: Record<string, unknown>;
}

export interface BotConfig {
  temperature?: number;
  system_prompt?: string;
  behavior_rules?: string | string[] | { rules: string[] };
  model?: string;
  max_tokens?: number;
}

export interface BotResponse {
  id: number;
  userId: string;
  name: string;
  description: string | null;
  createdAt: Date;
  configs?: Record<string, unknown>;
}

export interface EmbeddingResponse {
  id: number;
  sessionId: number;
  chunk: string;
  createdAt: Date;
}
