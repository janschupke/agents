export interface AgentWithConfig {
  id: number;
  name: string;
  description: string | null;
  avatarUrl: string | null;
  configs: Record<string, unknown>;
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
