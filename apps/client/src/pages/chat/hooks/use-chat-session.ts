import { useState, useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../../hooks/queries/query-keys';
import { useAgentSessions } from '../../../hooks/queries/use-agents';
import {
  useCreateSession,
  useDeleteSession,
} from '../../../hooks/mutations/use-agent-mutations';
import { Session, ChatHistoryResponse } from '../../../types/chat.types';
import { ChatService } from '../../../services/chat.service';
import { useSidebarLoadingState } from '../../../hooks/use-sidebar-loading-state';

interface UseChatSessionOptions {
  agentId: number | null;
  initialSessionId?: number | null;
}

interface UseChatSessionReturn {
  currentSessionId: number | null;
  sessions: Session[];
  sessionsLoading: boolean;
  setCurrentSessionId: (sessionId: number | null) => void;
  handleSessionSelect: (
    sessionId: number
  ) => Promise<ChatHistoryResponse | undefined>;
  handleNewSession: () => Promise<Session | undefined>;
  handleSessionDelete: (
    sessionId: number,
    onConfirm?: () => Promise<boolean>
  ) => Promise<void>;
}

/**
 * Hook to manage chat session state and operations
 * Extracted from ChatAgent component
 */
export function useChatSession({
  agentId,
  initialSessionId,
}: UseChatSessionOptions): UseChatSessionReturn {
  const queryClient = useQueryClient();
  const { data: sessions = [], isLoading: sessionsLoading } =
    useAgentSessions(agentId);

  // Use universal sidebar loading state hook - automatically checks cache
  const { shouldShowLoading: actualSessionsLoading } = useSidebarLoadingState({
    type: 'sessions',
    agentId,
    isLoading: sessionsLoading,
  });
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(
    initialSessionId ?? null
  );
  const createSessionMutation = useCreateSession();
  const deleteSessionMutation = useDeleteSession();
  const pendingNewSessionIdRef = useRef<number | null>(null);

  // Update sessionId when initialSessionId changes (from URL)
  // Only use initialSessionId if agentId is available (prevents using old session with new agent)
  useEffect(() => {
    if (initialSessionId !== undefined && agentId !== null) {
      setCurrentSessionId(initialSessionId);
    }
  }, [initialSessionId, agentId]);

  // Clear sessionId when agent changes - the old session doesn't belong to the new agent
  useEffect(() => {
    if (agentId === null) {
      setCurrentSessionId(null);
      pendingNewSessionIdRef.current = null;
    }
  }, [agentId]);

  // Prefetch chat history when session changes
  useEffect(() => {
    if (agentId && currentSessionId && currentSessionId > 0) {
      queryClient.prefetchQuery({
        queryKey: queryKeys.chat.history(agentId, currentSessionId),
      });
    }
  }, [agentId, currentSessionId, queryClient]);

  const handleSessionSelect = useCallback(
    async (sessionId: number) => {
      if (sessionId === currentSessionId || !agentId) {
        return;
      }

      // Optimistically update session ID immediately
      setCurrentSessionId(sessionId);

      // Load chat history
      const history = await queryClient.fetchQuery({
        queryKey: queryKeys.chat.history(agentId, sessionId),
        queryFn: () => ChatService.getChatHistory(agentId, sessionId),
      });

      return history;
    },
    [agentId, currentSessionId, queryClient]
  );

  const handleNewSession = useCallback(async () => {
    if (!agentId) return;

    try {
      const newSession = await createSessionMutation.mutateAsync(agentId);
      // Optimistically set it immediately
      setCurrentSessionId(newSession.id);
      return newSession;
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  }, [agentId, createSessionMutation]);

  const handleSessionDelete = useCallback(
    async (sessionId: number, onConfirm?: () => Promise<boolean>) => {
      if (!agentId) return;

      // If confirmation callback provided, use it
      if (onConfirm) {
        const confirmed = await onConfirm();
        if (!confirmed) {
          return;
        }
      }

      const wasCurrentSession = currentSessionId === sessionId;

      try {
        await deleteSessionMutation.mutateAsync({ agentId, sessionId });

        // Select first session if we deleted the current one
        if (wasCurrentSession) {
          const remainingSessions = sessions.filter((s) => s.id !== sessionId);
          if (remainingSessions.length > 0) {
            await handleSessionSelect(remainingSessions[0].id);
          } else {
            setCurrentSessionId(null);
          }
        }
      } catch (error) {
        console.error('Failed to delete session:', error);
        throw error;
      }
    },
    [
      agentId,
      currentSessionId,
      sessions,
      deleteSessionMutation,
      handleSessionSelect,
    ]
  );

  return {
    currentSessionId,
    sessions,
    sessionsLoading: actualSessionsLoading,
    setCurrentSessionId,
    handleSessionSelect,
    handleNewSession,
    handleSessionDelete,
  };
}
