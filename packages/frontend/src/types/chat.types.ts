export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatBotProps {
  botId: number;
}

export interface ChatHistoryResponse {
  bot: {
    id: number;
    name: string;
    description: string | null;
  };
  session: {
    id: number;
    session_name: string;
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
    session_name: string;
  };
}
