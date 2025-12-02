import { useSessionWithAgent } from './use-session-with-agent';

interface UseChatAgentDataOptions {
  propSessionId?: number;
  urlSessionId?: string;
  propAgentId?: number;
}

/**
 * Hook to fetch and manage chat agent data
 * Combines sessionId and agentId from various sources
 */
export function useChatAgentData({
  propSessionId,
  urlSessionId,
  propAgentId,
}: UseChatAgentDataOptions) {
  // Determine actual sessionId from URL or prop
  const sessionId =
    propSessionId ||
    (urlSessionId && !isNaN(parseInt(urlSessionId, 10))
      ? parseInt(urlSessionId, 10)
      : null);

  // If we have agentId from props, use it directly
  // Otherwise, derive it from session
  const {
    agentId: sessionAgentId,
    loading,
    error,
  } = useSessionWithAgent(propAgentId ? null : sessionId);

  const agentId = propAgentId || sessionAgentId;

  return {
    sessionId,
    agentId,
    loading,
    error,
  };
}
