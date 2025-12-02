import { useSessionWithAgent } from './use-session-with-agent';
import { LocalStorageManager } from '../../../utils/localStorage';
import { useAgents } from '../../../hooks/queries/use-agents';

/**
 * Hook to handle chat route logic
 * Determines agentId from sessionId and handles loading/error states
 * Falls back to last selected agent when no sessionId is provided
 * @param sessionId - Session ID from URL params
 * @param forceRefresh - Optional value that when changed forces a re-read of localStorage
 */
export function useChatRoute(sessionId: string | undefined, forceRefresh?: unknown) {
  const parsedSessionId =
    sessionId && !isNaN(parseInt(sessionId, 10))
      ? parseInt(sessionId, 10)
      : null;

  const {
    agentId: agentIdFromSession,
    loading: loadingSession,
    error,
  } = useSessionWithAgent(parsedSessionId);

  // Get last selected agent as fallback when no sessionId
  // forceRefresh is used to trigger re-read of localStorage when agent changes
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _ = forceRefresh; // Include to force re-run when agent changes
  const lastSelectedAgentId = LocalStorageManager.getSelectedAgentIdChat();
  const { data: agents = [], isLoading: loadingAgents } = useAgents();

  // Determine effective agentId
  let agentId: number | null = null;
  let loading = loadingSession;

  if (parsedSessionId) {
    // If we have a sessionId, use agentId from session
    agentId = agentIdFromSession;
    loading = loadingSession;
  } else {
    // No sessionId - fall back to last selected agent or first available agent
    loading = loadingAgents;
    if (lastSelectedAgentId) {
      // Check if last selected agent still exists
      const agentExists = agents.some((a) => a.id === lastSelectedAgentId);
      if (agentExists) {
        agentId = lastSelectedAgentId;
      } else if (agents.length > 0) {
        // Last selected agent doesn't exist, use first available
        agentId = agents[0].id;
        LocalStorageManager.setSelectedAgentIdChat(agentId);
      }
    } else if (agents.length > 0) {
      // No last selected, use first available
      agentId = agents[0].id;
      LocalStorageManager.setSelectedAgentIdChat(agentId);
    }
  }

  return {
    sessionId: parsedSessionId,
    agentId,
    loading,
    error,
  };
}
