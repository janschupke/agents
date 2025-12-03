import { useAgents } from '../../../hooks/queries/use-agents';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../../hooks/queries/query-keys';
import { Session, Agent } from '../../../types/chat.types';
import { useSidebarLoadingState } from '../../../hooks/utils/use-sidebar-loading-state';

interface UseChatLoadingStateOptions {
  agentId: number | null;
  sessionId: number | null;
  agentsLoading: boolean;
  sessionsLoading: boolean;
  messagesLoading: boolean;
  isSendingMessage: boolean;
}

interface UseChatLoadingStateReturn {
  // Full page loading (only on initial load)
  isInitialLoad: boolean;

  // Sidebar loading (only if agents/sessions unavailable)
  sidebarLoading: boolean;

  // Container loading (only if agents unavailable)
  containerLoading: boolean;

  // Page content loading (only if specific data missing)
  // Distinguishes between:
  // - Initial chat load: Show loading state for chat area
  // - Awaiting new message: Only show typing indicator (handled separately)
  contentLoading: boolean;

  // Typing indicator (only when sending message or awaiting response)
  // This is separate from contentLoading to avoid showing full loading state
  showTypingIndicator: boolean;
}

/**
 * Hook to centralize loading state logic with clear distinctions
 * Prevents unnecessary loading states and provides granular control
 */
export function useChatLoadingState({
  agentId,
  sessionId,
  agentsLoading,
  sessionsLoading,
  messagesLoading,
  isSendingMessage,
}: UseChatLoadingStateOptions): UseChatLoadingStateReturn {
  const queryClient = useQueryClient();
  // Call useAgents to ensure query runs (but check cache directly, not the returned data)
  useAgents();

  // Use universal sidebar loading state hook
  const { shouldShowLoading: shouldShowAgentsLoading } = useSidebarLoadingState(
    {
      type: 'agents',
      isLoading: agentsLoading,
    }
  );
  const { shouldShowLoading: shouldShowSessionsLoading } =
    useSidebarLoadingState({
      type: 'sessions',
      agentId,
      isLoading: sessionsLoading,
    });

  // Check React Query cache directly (not array length)
  // Cache is source of truth - persists across render cycles
  const hasCachedAgents =
    queryClient.getQueryData<Agent[]>(queryKeys.agents.list()) !== undefined;
  const hasCachedSessionsForCurrentAgent =
    agentId !== null
      ? queryClient.getQueryData<Session[]>(
          queryKeys.agents.sessions(agentId)
        ) !== undefined
      : false;
  const hasCachedMessages =
    agentId !== null && sessionId !== null
      ? queryClient.getQueryData(queryKeys.chat.history(agentId, sessionId)) !==
        undefined
      : false;

  // Full page loading (only on initial load)
  // Check cache directly, not array length or props
  // Only true if cache has NO data for agents OR sessions
  // Messages loading should NOT trigger full page load - only content loading
  // This ensures sidebar stays visible when loading messages
  const isInitialLoad =
    (!hasCachedAgents && agentsLoading) ||
    (!hasCachedSessionsForCurrentAgent && sessionsLoading && agentId !== null);

  // Sidebar loading (only if agents/sessions unavailable)
  // CRITICAL: Check React Query cache directly, not array length or hasSessions prop
  // Array length can be 0 during render cycles even when cache has data
  // Cache is the source of truth - if cache has data for current agent, we're not loading

  // Use universal sidebar loading state - automatically checks cache
  // This prevents sidebar from showing loading when:
  // - Clicking a session (which loads message history, not sessions)
  // - Navigating between sessions (sessions are already in cache)
  // - Background refetches of sessions (cache has data, so not loading)
  const sidebarLoading = shouldShowAgentsLoading || shouldShowSessionsLoading;

  // Container loading (only if agents unavailable)
  // Only true if agents loading AND no cached agents
  const containerLoading = agentsLoading && !hasCachedAgents;

  // Page content loading (only if specific data missing)
  // Only true if initial chat load (messages loading AND no cached messages for current session AND not sending message)
  const contentLoading =
    messagesLoading &&
    !hasCachedMessages &&
    !isSendingMessage &&
    sessionId !== null;

  // Typing indicator (only when sending message or awaiting response)
  // This is separate from contentLoading to avoid showing full loading state
  const showTypingIndicator = isSendingMessage;

  return {
    isInitialLoad,
    sidebarLoading,
    containerLoading,
    contentLoading,
    showTypingIndicator,
  };
}
