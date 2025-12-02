import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../../hooks/queries/query-keys';
import { ChatService } from '../../../services/chat.service';
import { useToast } from '../../../contexts/ToastContext';
import { useTranslation, I18nNamespace } from '@openai/i18n';
import { Session } from '../../../types/chat.types';

interface SessionWithAgent {
  session: Session;
  agentId: number;
}

/**
 * Hook to fetch session with agent ID
 * Used for routing when we have a sessionId but need the agentId
 */
export function useSessionWithAgent(sessionId: number | null) {
  const { showToast } = useToast();
  const { t } = useTranslation(I18nNamespace.CLIENT);

  const { data, isLoading, isError, error } = useQuery<SessionWithAgent>({
    queryKey: queryKeys.sessions.withAgent(sessionId!),
    queryFn: () => ChatService.getSessionWithAgent(sessionId!),
    enabled: sessionId !== null && sessionId > 0,
    onError: (error: Error) => {
      showToast(
        error.message || t('chat.errors.fetchSessionFailed'),
        'error'
      );
    },
  });

  return {
    session: data?.session,
    agentId: data?.agentId ?? null,
    loading: isLoading,
    error: isError ? (error as Error)?.message : null,
  };
}
