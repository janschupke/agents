import { useSessionWithAgent } from './use-session-with-agent';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../../hooks/queries/query-keys';
import { Session } from '../../../types/chat.types';

/**
 * Hook to handle chat route logic
 * Validates that session belongs to the specified agent
 * @param agentId - Agent ID from URL params
 * @param sessionId - Session ID from URL params
 */
export function useChatRoute(agentId: number | null, sessionId: number | null) {
  const queryClient = useQueryClient();

  // If we have both agentId and sessionId from URL, we can validate using cached sessions
  // instead of calling useSessionWithAgent (which triggers a query)
  const cachedSessions =
    agentId !== null
      ? queryClient.getQueryData<Session[]>(queryKeys.agents.sessions(agentId))
      : undefined;

  // Check if sessionId is in the cached sessions list
  // null = can't determine (no cache), true = belongs, false = doesn't belong
  const sessionBelongsToAgent =
    agentId !== null && sessionId !== null && cachedSessions
      ? cachedSessions.some((s) => s.id === sessionId)
      : null;

  // Only call useSessionWithAgent if:
  // 1. We don't have agentId (need to fetch it from session)
  // 2. OR we have agentId but can't validate from cache (no cached sessions or session not found)
  // If we validated from cache and session belongs, skip the query entirely
  const needsSessionQuery =
    agentId === null || (sessionId !== null && sessionBelongsToAgent !== true);

  const {
    agentId: agentIdFromSession,
    loading: loadingSession,
    error,
  } = useSessionWithAgent(needsSessionQuery ? sessionId : null);

  // If we validated from cache, we're not loading
  // Otherwise, check cache for session data
  const hasCachedSessionData =
    sessionId !== null
      ? queryClient.getQueryData(queryKeys.sessions.withAgent(sessionId)) !==
        undefined
      : false;

  // Only consider it loading if:
  // 1. We need the session query AND cache has no data AND query is loading
  // 2. OR we validated from cache (not loading)
  const actualLoading = needsSessionQuery
    ? hasCachedSessionData
      ? false
      : loadingSession
    : false;

  // Validate that session belongs to the agent
  if (sessionId && agentId) {
    // If we validated from cache and session doesn't belong, return error
    if (sessionBelongsToAgent === false) {
      return {
        agentId: null,
        sessionId: null,
        loading: false,
        error: 'Session does not belong to the specified agent',
      };
    }
    // If we got agentId from session query and it doesn't match, return error
    if (agentIdFromSession !== null && agentIdFromSession !== agentId) {
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
    loading: actualLoading,
    error: error || null,
  };
}
