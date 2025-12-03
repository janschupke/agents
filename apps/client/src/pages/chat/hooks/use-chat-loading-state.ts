import { useAgents } from '../../../hooks/queries/use-agents';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../../hooks/queries/query-keys';
import { Session } from '../../../types/chat.types';

interface UseChatLoadingStateOptions {
  agentId: number | null;
  sessionId: number | null;
  agentsLoading: boolean;
  sessionsLoading: boolean;
  messagesLoading: boolean;
  isSendingMessage: boolean;
  hasMessages: boolean;
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
  hasMessages,
}: UseChatLoadingStateOptions): UseChatLoadingStateReturn {
  const queryClient = useQueryClient();
  const { data: agents = [] } = useAgents();

  // Check if we have cached data
  const hasCachedAgents = agents.length > 0;
  const hasCachedSessions =
    agentId !== null
      ? queryClient.getQueryData<Session[]>(
          queryKeys.agents.sessions(agentId)
        ) !== undefined
      : false;
  const hasCachedMessages =
    agentId !== null && sessionId !== null
      ? queryClient.getQueryData(
          queryKeys.chat.history(agentId, sessionId)
        ) !== undefined
      : false;

  // Full page loading (only on initial load)
  // Only true if no agents AND no sessions AND no messages
  const isInitialLoad =
    !hasCachedAgents &&
    !hasCachedSessions &&
    !hasMessages &&
    (agentsLoading || sessionsLoading || messagesLoading);

  // Sidebar loading (only if agents/sessions unavailable)
  // Only true if agents loading OR (sessions loading AND no cached sessions)
  const sidebarLoading =
    agentsLoading || (sessionsLoading && !hasCachedSessions);

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
