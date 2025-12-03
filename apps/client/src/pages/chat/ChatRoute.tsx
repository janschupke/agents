import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { ROUTES } from '../../constants/routes.constants';
import ChatAgent from './components/chat/ChatAgent';
import { useChatRoute } from './hooks/use-chat-route';
import ChatLoadingState from './components/chat/ChatLoadingState';
import ChatErrorState from './components/chat/ChatErrorState';
import { useTranslation, I18nNamespace } from '@openai/i18n';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../hooks/queries/query-keys';
import { useAgents } from '../../hooks/queries/use-agents';
import { useAgentSessions } from '../../hooks/queries/use-agents';
import { LocalStorageManager } from '../../utils/localStorage';
import { Session } from '../../types/chat.types';

export default function ChatRoute() {
  const { agentId: urlAgentId, sessionId: urlSessionId } = useParams<{
    agentId?: string;
    sessionId?: string;
  }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useTranslation(I18nNamespace.CLIENT);
  const { data: agents = [], isLoading: loadingAgents } = useAgents();
  const storedAgentId = LocalStorageManager.getSelectedAgentIdChat();

  // Parse agentId and sessionId (call hooks unconditionally)
  const parsedAgentId = urlAgentId
    ? isNaN(parseInt(urlAgentId, 10))
      ? null
      : parseInt(urlAgentId, 10)
    : null;
  const parsedSessionId = urlSessionId
    ? isNaN(parseInt(urlSessionId, 10))
      ? null
      : parseInt(urlSessionId, 10)
    : null;

  // Call hooks unconditionally - use null agentId if not in URL to disable query
  const { data: sessions = [], isLoading: sessionsLoading } =
    useAgentSessions(parsedAgentId);
  const { loading: routeLoading, error: routeError } = useChatRoute(
    parsedAgentId,
    parsedSessionId
  );

  // Check React Query cache directly for sessions (not isLoading)
  // Cache is source of truth - persists across render cycles
  const hasCachedSessionsForAgent =
    parsedAgentId !== null
      ? queryClient.getQueryData<Session[]>(
          queryKeys.agents.sessions(parsedAgentId)
        ) !== undefined
      : false;

  // Only consider sessions loading if cache has no data AND query is loading
  const actualSessionsLoading = hasCachedSessionsForAgent
    ? false
    : sessionsLoading;

  // Handle /chat route (no agentId)
  useEffect(() => {
    if (!urlAgentId && !loadingAgents) {
      // Determine agentId: localStorage > first available
      const effectiveAgentId = storedAgentId || agents[0]?.id;

      if (effectiveAgentId) {
        // Get sessions for this agent
        const cachedSessions = queryClient.getQueryData<Session[]>(
          queryKeys.agents.sessions(effectiveAgentId)
        );

        // Navigate to agent route, or agent + most recent session
        if (cachedSessions && cachedSessions.length > 0) {
          navigate(
            ROUTES.CHAT_SESSION(effectiveAgentId, cachedSessions[0].id),
            {
              replace: true,
            }
          );
        } else {
          navigate(ROUTES.CHAT_AGENT(effectiveAgentId), { replace: true });
        }
      }
    }
  }, [urlAgentId, loadingAgents, storedAgentId, agents, queryClient, navigate]);

  // Handle /chat/:agentId route (no sessionId) - auto-select most recent session
  useEffect(() => {
    if (
      parsedAgentId &&
      !urlSessionId &&
      !actualSessionsLoading &&
      sessions.length > 0
    ) {
      const mostRecent = sessions[0];
      navigate(ROUTES.CHAT_SESSION(parsedAgentId, mostRecent.id), {
        replace: true,
      });
    }
  }, [parsedAgentId, urlSessionId, actualSessionsLoading, sessions, navigate]);

  // Update localStorage when agentId changes
  useEffect(() => {
    if (parsedAgentId) {
      LocalStorageManager.setSelectedAgentIdChat(parsedAgentId);
    }
  }, [parsedAgentId]);

  // Handle /chat route (no agentId) - show loading while redirecting
  if (!urlAgentId) {
    const effectiveAgentId = storedAgentId || agents[0]?.id;
    if (loadingAgents || !effectiveAgentId) {
      return <ChatLoadingState />;
    }
    return <ChatLoadingState />; // Will redirect via useEffect
  }

  // Invalid agentId
  if (parsedAgentId === null) {
    return <Navigate to={ROUTES.CHAT} replace />;
  }

  // Handle /chat/:agentId route (no sessionId)
  if (!urlSessionId) {
    // Show loading only if cache has no data AND query is loading
    if (actualSessionsLoading) {
      return <ChatLoadingState />;
    }

    if (sessions.length === 0) {
      // No sessions, show chat with empty state
      return <ChatAgent agentId={parsedAgentId} />;
    }

    return <ChatLoadingState />; // Will redirect via useEffect
  }

  // Handle /chat/:agentId/:sessionId route
  if (parsedSessionId === null) {
    return <Navigate to={ROUTES.CHAT_AGENT(parsedAgentId)} replace />;
  }

  if (routeLoading) {
    return <ChatLoadingState />;
  }

  if (routeError) {
    return (
      <ChatErrorState
        message={routeError || t('chat.errors.sessionNotFound')}
      />
    );
  }

  return <ChatAgent sessionId={parsedSessionId} agentId={parsedAgentId} />;
}
