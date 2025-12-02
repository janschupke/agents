import { useQuery } from '@tanstack/react-query';
import { ChatService } from '../../services/chat.service';
import { ChatHistoryResponse, Session } from '../../types/chat.types';
import { queryKeys } from './query-keys';

export function useChatHistory(botId: number | null, sessionId?: number | null) {
  return useQuery<ChatHistoryResponse>({
    queryKey: queryKeys.chat.history(botId!, sessionId || undefined),
    queryFn: () => ChatService.getChatHistory(botId!, sessionId || undefined),
    enabled: botId !== null,
  });
}

export function useSessions(botId: number | null) {
  return useQuery<Session[]>({
    queryKey: queryKeys.chat.sessions(botId!),
    queryFn: () => ChatService.getSessions(botId!),
    enabled: botId !== null,
  });
}
