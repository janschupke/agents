import { SendMessageDto } from './send-message.dto';

export class SessionResponseDto {
  id: number;
  session_name: string | null;
  createdAt: Date;
}

export class MessageResponseDto {
  role: 'user' | 'assistant' | 'system';
  content: string;
  rawRequest?: unknown;
  rawResponse?: unknown;
}

export class ChatHistoryResponseDto {
  bot: {
    id: number;
    name: string;
    description: string | null;
  };
  session: {
    id: number;
    session_name: string | null;
  };
  messages: MessageResponseDto[];
}

export class SendMessageResponseDto {
  response: string;
  session: {
    id: number;
    session_name: string | null;
  };
  rawRequest?: unknown;
  rawResponse?: unknown;
}

// Re-export SendMessageDto for convenience
export { SendMessageDto };
