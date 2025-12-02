import { useCallback } from 'react';
import { NavigateFunction } from 'react-router-dom';
import { ROUTES } from '../../../constants/routes.constants';
import { useCreateSession } from '../../../hooks/mutations/use-agent-mutations';

interface UseChatAgentNavigationOptions {
  agentId: number | null;
  navigate: NavigateFunction;
}

/**
 * Hook to handle chat navigation logic
 * Replaces state management with URL navigation
 */
export function useChatAgentNavigation({
  agentId,
  navigate,
}: UseChatAgentNavigationOptions) {
  const createSessionMutation = useCreateSession();

  const handleSessionSelect = useCallback(
    (sessionId: number) => {
      navigate(ROUTES.CHAT_SESSION(sessionId));
    },
    [navigate]
  );

  const handleNewSession = useCallback(async () => {
    if (!agentId) return undefined;

    try {
      const newSession = await createSessionMutation.mutateAsync(agentId);
      navigate(ROUTES.CHAT_SESSION(newSession.id));
      return newSession;
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  }, [agentId, createSessionMutation, navigate]);

  return {
    handleSessionSelect,
    handleNewSession,
  };
}
