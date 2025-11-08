export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatBotProps {
  botId: number;
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
}
