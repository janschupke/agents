export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  rawRequest?: unknown;
  rawResponse?: unknown;
}

export interface ChatSession {
  id: number;
  session_name: string | null;
  createdAt: Date;
}

export interface ChatHistory {
  bot: {
    id: number;
    name: string;
    description: string | null;
  };
  session: {
    id: number;
    session_name: string | null;
  };
  messages: ChatMessage[];
}

export interface SendMessageResult {
  response: string;
  session: {
    id: number;
    session_name: string | null;
  };
  rawRequest?: unknown;
  rawResponse?: unknown;
}
