import { useState, useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../../hooks/queries/query-keys';
import { useAgentSessions } from '../../../hooks/queries/use-agents';
import { useCreateSession, useDeleteSession } from '../../../hooks/mutations/use-agent-mutations';
import { Session, ChatHistoryResponse } from '../../../types/chat.types';

interface UseChatSessionOptions {
  agentId: number | null;
}

interface UseChatSessionReturn {
  currentSessionId: number | null;
  sessions: Session[];
  sessionsLoading: boolean;
  setCurrentSessionId: (sessionId: number | null) => void;
  handleSessionSelect: (sessionId: number) => Promise<ChatHistoryResponse | undefined>;
  handleNewSession: () => Promise<Session | undefined>;
  handleSessionDelete: (sessionId: number, onConfirm?: () => Promise<boolean>) => Promise<void>;
}

/**
 * Hook to manage chat session state and operations
 * Extracted from ChatAgent component
 */
export function useChatSession({ agentId }: UseChatSessionOptions): UseChatSessionReturn {
  const queryClient = useQueryClient();
  const { data: sessions = [], isLoading: sessionsLoading } = useAgentSessions(agentId);
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const createSessionMutation = useCreateSession();
  const deleteSessionMutation = useDeleteSession();
  const sessionsInitializedRef = useRef(false);

  // Auto-select most recent session when sessions first load or when agent changes
  useEffect(() => {
    if (!agentId || sessionsLoading) {
      return;
    }

    // When sessions first load for this agent, select the most recent one
    if (sessions.length > 0) {
      const mostRecentSessionId = sessions[0].id; // Sessions are ordered by createdAt desc (most recent first)
      
      // On first load or when agent changes, always select most recent session
      if (!sessionsInitializedRef.current || !currentSessionId) {
        setCurrentSessionId(mostRecentSessionId);
        sessionsInitializedRef.current = true;
      } else {
        // After initialization, validate current session still exists
        const sessionExists = sessions.some((s) => s.id === currentSessionId);
        if (!sessionExists) {
          // Current session no longer exists, select most recent
          setCurrentSessionId(mostRecentSessionId);
        }
        sessionsInitializedRef.current = true;
      }
    } else if (sessions.length === 0) {
      // No sessions available
      setCurrentSessionId(null);
      sessionsInitializedRef.current = true;
    }
  }, [agentId, sessionsLoading, sessions, currentSessionId]);

  // Reset initialization flag when agent changes
  useEffect(() => {
    sessionsInitializedRef.current = false;
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
        queryFn: async () => {
          const { ChatService } = await import('../../../services/chat.service');
          return ChatService.getChatHistory(agentId, sessionId);
        },
      });
      
      return history;
    },
    [agentId, currentSessionId, queryClient]
  );

  const handleNewSession = useCallback(async () => {
    if (!agentId) return;
    
    try {
      const newSession = await createSessionMutation.mutateAsync(agentId);
      // Select the new session
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
    [agentId, currentSessionId, sessions, deleteSessionMutation, handleSessionSelect]
  );

  return {
    currentSessionId,
    sessions,
    sessionsLoading,
    setCurrentSessionId,
    handleSessionSelect,
    handleNewSession,
    handleSessionDelete,
  };
}
