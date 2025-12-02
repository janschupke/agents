import { SendMessageDto } from './send-message.dto';

export class SessionResponseDto {
  id!: number;
  session_name!: string | null;
  createdAt!: Date;
}

export class UpdateSessionDto {
  session_name?: string;
}

export class MessageResponseDto {
  id?: number;
  role!: 'user' | 'assistant' | 'system';
  content!: string;
  rawRequest?: unknown;
  rawResponse?: unknown;
  translation?: string;
  wordTranslations?: Array<{
    originalWord: string;
    translation: string;
    sentenceContext?: string;
  }>;
}

export class ChatHistoryResponseDto {
  agent!: {
    id: number;
    name: string;
    description: string | null;
  };
  session!: {
    id: number;
    session_name: string | null;
  } | null;
  messages!: MessageResponseDto[];
}

export class SendMessageResponseDto {
  response!: string;
  session!: {
    id: number;
    session_name: string | null;
  };
  rawRequest?: unknown;
  rawResponse?: unknown;
  userMessageId?: number;
  assistantMessageId?: number;
  translation?: string; // Full translation (derived from word translations for assistant messages)
  wordTranslations?: Array<{
    originalWord: string;
    translation: string;
    sentenceContext?: string;
  }>; // Word translations (for assistant messages)
}

// Re-export SendMessageDto for convenience
export { SendMessageDto };
