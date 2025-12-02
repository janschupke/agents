import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import { useTokenReady } from '../use-token-ready';
import { ChatService } from '../../services/chat.service';
import { ChatHistoryResponse, Session } from '../../types/chat.types';
import { queryKeys } from './query-keys';

export function useChatHistory(botId: number | null, sessionId?: number | null) {
  const { isSignedIn, isLoaded } = useAuth();
  const tokenReady = useTokenReady();

  return useQuery<ChatHistoryResponse>({
    queryKey: queryKeys.chat.history(botId!, sessionId || undefined),
    queryFn: () => ChatService.getChatHistory(botId!, sessionId || undefined),
    enabled: botId !== null && isSignedIn && isLoaded && tokenReady,
  });
}

export function useSessions(botId: number | null) {
  const { isSignedIn, isLoaded } = useAuth();
  const tokenReady = useTokenReady();

  return useQuery<Session[]>({
    queryKey: queryKeys.chat.sessions(botId!),
    queryFn: () => ChatService.getSessions(botId!),
    enabled: botId !== null && isSignedIn && isLoaded && tokenReady,
  });
}
