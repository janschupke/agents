// MessageRole is now imported from @openai/shared-types (this is an enum, not a type)
import { MessageRole } from '@openai/shared-types';
export { MessageRole };

export interface WordTranslation {
  originalWord: string;
  translation: string;
  sentenceContext?: string;
}

export interface Message {
  id?: number;
  role: MessageRole;
  content: string;
  rawRequest?: unknown; // Raw OpenAI request JSON for user messages
  rawResponse?: unknown; // Raw OpenAI response JSON for assistant messages
  translation?: string; // Translated text in English
  wordTranslations?: WordTranslation[]; // Word-level translations (assistant only)
}

export interface Session {
  id: number;
  session_name: string | null;
  createdAt: string;
}

export interface ChatHistoryResponse {
  agent: {
    id: number;
    name: string;
    description: string | null;
  };
  session: {
    id: number;
    session_name: string | null;
  } | null;
  messages: Message[];
  savedWordMatches: Array<{
    originalWord: string;
    savedWordId: number;
    translation: string;
    pinyin: string | null;
  }>;
  hasMore: boolean;
}

export interface SendMessageRequest {
  message: string;
}

export interface SendMessageResponse {
  response: string;
  session: {
    id: number;
    session_name: string | null;
  };
  rawRequest?: unknown; // Raw OpenAI request JSON
  rawResponse?: unknown; // Raw OpenAI response JSON
  userMessageId?: number;
  assistantMessageId?: number;
  translation?: string; // Full translation (included in initial response for assistant messages)
  wordTranslations?: WordTranslation[]; // Word translations with translations (for assistant messages)
  savedWordMatches?: Array<{
    originalWord: string;
    savedWordId: number;
    translation: string;
    pinyin: string | null;
  }>; // Saved word matches for highlighting
}

import { AgentType } from '@openai/shared-types';

export interface Agent {
  id: number;
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
    age?: number;
    gender?: string;
    personality?: string;
    sentiment?: string;
    interests?: string[];
  };
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

export interface CreateAgentRequest {
  name: string;
  description?: string;
  avatarUrl?: string;
  agentType?: AgentType;
  language?: string;
  configs?: {
    temperature?: number;
    system_prompt?: string;
    age?: number;
    gender?: string;
    personality?: string;
    sentiment?: string;
    interests?: string[];
  };
}

export interface UpdateAgentRequest {
  name: string;
  description?: string;
  avatarUrl?: string;
  agentType?: AgentType;
  language?: string;
  configs?: {
    temperature?: number;
    system_prompt?: string;
    age?: number;
    gender?: string;
    personality?: string;
    sentiment?: string;
    interests?: string[];
  };
}

export interface User {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
  roles: string[];
}
