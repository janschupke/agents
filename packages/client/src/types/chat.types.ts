export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  rawRequest?: unknown; // Raw OpenAI request JSON for user messages
  rawResponse?: unknown; // Raw OpenAI response JSON for assistant messages
}

export interface ChatBotProps {
  botId?: number;
}

export interface Session {
  id: number;
  session_name: string | null;
  createdAt: string;
}

export interface ChatHistoryResponse {
  bot: {
    id: number;
    name: string;
    description: string | null;
  };
  session: {
    id: number;
    session_name: string | null;
  };
  messages: Message[];
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
}

export interface Bot {
  id: number;
  name: string;
  description: string | null;
  createdAt: string;
  configs?: {
    temperature?: number;
    system_prompt?: string;
    behavior_rules?: string | unknown;
  };
}

export interface Embedding {
  id: number;
  sessionId: number;
  chunk: string;
  createdAt: string;
}

export interface CreateBotRequest {
  name: string;
  description?: string;
  configs?: {
    temperature?: number;
    system_prompt?: string;
    behavior_rules?: string | unknown;
  };
}

export interface UpdateBotRequest {
  name: string;
  description?: string;
  configs?: {
    temperature?: number;
    system_prompt?: string;
    behavior_rules?: string | unknown;
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
