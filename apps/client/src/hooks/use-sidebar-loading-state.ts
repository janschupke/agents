import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './queries/query-keys';
import { Agent, Session } from '../types/chat.types';

interface UseSidebarLoadingStateOptions {
  /**
   * Type of sidebar data to check
   */
  type: 'agents' | 'sessions';

  /**
   * For 'sessions' type, the agentId to check sessions for
   */
  agentId?: number | null;

  /**
   * The isLoading value from React Query hook
   */
  isLoading: boolean;
}

/**
 * Universal hook to determine if sidebar should show loading state
 * Checks React Query cache directly - if cache has data, we're not loading
 * This prevents sidebar from showing loading skeleton when data exists in cache
 *
 * @example
 * const { data: agents, isLoading } = useAgents();
 * const { shouldShowLoading } = useSidebarLoadingState({
 *   type: 'agents',
 *   isLoading,
 * });
 */
export function useSidebarLoadingState({
  type,
  agentId,
  isLoading,
}: UseSidebarLoadingStateOptions): { shouldShowLoading: boolean } {
  const queryClient = useQueryClient();

  // Check React Query cache directly (not array length)
  // Cache is source of truth - persists across render cycles
  let hasCachedData = false;

  if (type === 'agents') {
    hasCachedData =
      queryClient.getQueryData<Agent[]>(queryKeys.agents.list()) !== undefined;
  } else if (type === 'sessions') {
    // For sessions, we can only check cache if agentId is provided
    // If agentId is null, we can't determine if data exists, so don't show loading
    if (agentId !== null && agentId !== undefined) {
      hasCachedData =
        queryClient.getQueryData<Session[]>(
          queryKeys.agents.sessions(agentId)
        ) !== undefined;
    } else {
      // No agentId means we can't check cache, so don't show loading
      return { shouldShowLoading: false };
    }
  }

  // Only show loading if cache has no data AND query is loading
  const shouldShowLoading = hasCachedData ? false : isLoading;

  return { shouldShowLoading };
}
