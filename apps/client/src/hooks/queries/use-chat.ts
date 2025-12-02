import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import { useTokenReady } from '../use-token-ready';
import { ChatService } from '../../services/chat.service';
import { ChatHistoryResponse, Session } from '../../types/chat.types';
import { queryKeys } from './query-keys';

export function useChatHistory(
  agentId: number | null,
  sessionId?: number | null
) {
  const { isSignedIn, isLoaded } = useAuth();
  const tokenReady = useTokenReady();

  return useQuery<ChatHistoryResponse>({
    queryKey: queryKeys.chat.history(agentId!, sessionId || undefined),
    queryFn: () => ChatService.getChatHistory(agentId!, sessionId || undefined),
    enabled: agentId !== null && isSignedIn && isLoaded && tokenReady,
  });
}

function useSessions(agentId: number | null) {
  const { isSignedIn, isLoaded } = useAuth();
  const tokenReady = useTokenReady();

  return useQuery<Session[]>({
    queryKey: queryKeys.chat.sessions(agentId!),
    queryFn: () => ChatService.getSessions(agentId!),
    enabled: agentId !== null && isSignedIn && isLoaded && tokenReady,
  });
}
