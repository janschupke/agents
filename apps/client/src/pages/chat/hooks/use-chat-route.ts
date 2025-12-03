import { useSessionWithAgent } from './use-session-with-agent';

/**
 * Hook to handle chat route logic
 * Validates that session belongs to the specified agent
 * @param agentId - Agent ID from URL params
 * @param sessionId - Session ID from URL params
 */
export function useChatRoute(
  agentId: number | null,
  sessionId: number | null
) {
  const {
    agentId: agentIdFromSession,
    loading: loadingSession,
    error,
  } = useSessionWithAgent(sessionId);

  // Validate that session belongs to the agent
  if (sessionId && agentId && agentIdFromSession !== null) {
    if (agentIdFromSession !== agentId) {
      return {
        agentId: null,
        sessionId: null,
        loading: false,
        error: 'Session does not belong to the specified agent',
      };
    }
  }

  return {
    agentId: agentId || agentIdFromSession,
    sessionId,
    loading: loadingSession,
    error: error || null,
  };
}
