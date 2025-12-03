import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import { useTokenReady } from '../utils/use-token-ready';
import { MessageService } from '../../services/chat/message/message.service';
import { ChatHistoryResponse } from '../../types/chat.types';
import { queryKeys } from './query-keys';
import { CHAT_HISTORY_STALE_TIME } from '../../constants/cache.constants';

export function useChatHistory(
  agentId: number | null,
  sessionId?: number | null
) {
  const { isSignedIn, isLoaded } = useAuth();
  const tokenReady = useTokenReady();

  return useQuery<ChatHistoryResponse>({
    queryKey: queryKeys.chat.history(agentId!, sessionId || undefined),
    queryFn: () => MessageService.getChatHistory(agentId!, sessionId || undefined),
    enabled: agentId !== null && isSignedIn && isLoaded && tokenReady,
    staleTime: CHAT_HISTORY_STALE_TIME,
  });
}
