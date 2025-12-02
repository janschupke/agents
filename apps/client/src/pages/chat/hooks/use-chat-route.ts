import { useSessionWithAgent } from './use-session-with-agent';

/**
 * Hook to handle chat route logic
 * Determines agentId from sessionId and handles loading/error states
 */
export function useChatRoute(sessionId: string | undefined) {
  const parsedSessionId =
    sessionId && !isNaN(parseInt(sessionId, 10))
      ? parseInt(sessionId, 10)
      : null;

  const { agentId, loading, error } = useSessionWithAgent(parsedSessionId);

  return {
    sessionId: parsedSessionId,
    agentId,
    loading,
    error,
  };
}
