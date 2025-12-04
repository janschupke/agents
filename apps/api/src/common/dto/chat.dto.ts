import { SendMessageDto } from './send-message.dto';
import { MessageRole } from '../enums/message-role.enum';

export class SessionResponseDto {
  id!: number;
  session_name!: string | null;
  createdAt!: Date;
}

export class SessionWithAgentResponseDto {
  session!: SessionResponseDto;
  agentId!: number;
}

import { IsOptional, IsString } from 'class-validator';

export class UpdateSessionDto {
  @IsOptional()
  @IsString()
  session_name?: string;
}

export class MessageResponseDto {
  id?: number;
  role!: MessageRole;
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
  savedWordMatches!: SavedWordMatchDto[]; // All saved words that match words in this session
  hasMore!: boolean; // Indicates if there are more messages to load
}

export class SavedWordMatchDto {
  originalWord!: string;
  savedWordId!: number;
  translation!: string;
  pinyin!: string | null;
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
  savedWordMatches?: SavedWordMatchDto[]; // Saved word matches for highlighting
}

// Re-export SendMessageDto for convenience
export { SendMessageDto };
