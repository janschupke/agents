export enum AgentType {
  GENERAL = 'GENERAL',
  LANGUAGE_ASSISTANT = 'LANGUAGE_ASSISTANT',
}

export enum ResponseLength {
  SHORT = 'short',
  STANDARD = 'standard',
  LONG = 'long',
  ADAPT = 'adapt',
}

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  NON_BINARY = 'non-binary',
  PREFER_NOT_TO_SAY = 'prefer-not-to-say',
}

export enum Sentiment {
  NEUTRAL = 'neutral',
  ENGAGED = 'engaged',
  FRIENDLY = 'friendly',
  ATTRACTED = 'attracted',
  OBSESSED = 'obsessed',
  DISINTERESTED = 'disinterested',
  ANGRY = 'angry',
}

export enum Availability {
  AVAILABLE = 'available',
  STANDARD = 'standard',
  BUSY = 'busy',
}

export interface Agent {
  id: number;
  userId: string;
  name: string;
  description: string | null;
  avatarUrl: string | null;
  agentType: AgentType | null;
  language: string | null;
  createdAt: string;
  memorySummary?: string | null;
  configs?: {
    temperature?: number;
    system_prompt?: string;
    behavior_rules?: string | unknown;
    model?: string;
    max_tokens?: number;
    response_length?: ResponseLength;
    age?: number;
    gender?: Gender;
    personality?: string;
    sentiment?: Sentiment;
    interests?: string[];
    availability?: Availability;
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
  agentType?: AgentType;
  language?: string;
  configs?: Record<string, unknown>;
}

export interface UpdateMemoryRequest {
  keyPoint: string;
}
