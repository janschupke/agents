import { useState, useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './queries/query-keys.js';
import { useBotSessions } from './queries/use-bots.js';
import { useCreateSession, useDeleteSession } from './mutations/use-bot-mutations.js';
import { Session } from '../types/chat.types.js';

interface UseChatSessionOptions {
  botId: number | null;
}

interface UseChatSessionReturn {
  currentSessionId: number | null;
  sessions: Session[];
  sessionsLoading: boolean;
  setCurrentSessionId: (sessionId: number | null) => void;
  handleSessionSelect: (sessionId: number) => Promise<void>;
  handleNewSession: () => Promise<void>;
  handleSessionDelete: (sessionId: number, onConfirm?: () => Promise<boolean>) => Promise<void>;
}

/**
 * Hook to manage chat session state and operations
 * Extracted from ChatBot component
 */
export function useChatSession({ botId }: UseChatSessionOptions): UseChatSessionReturn {
  const queryClient = useQueryClient();
  const { data: sessions = [], isLoading: sessionsLoading } = useBotSessions(botId);
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const createSessionMutation = useCreateSession();
  const deleteSessionMutation = useDeleteSession();
  const sessionsInitializedRef = useRef(false);

  // Auto-select most recent session when sessions first load or when bot changes
  useEffect(() => {
    if (!botId || sessionsLoading) {
      return;
    }

    // When sessions first load for this bot, select the most recent one
    if (sessions.length > 0) {
      const mostRecentSessionId = sessions[0].id; // Sessions are ordered by createdAt desc (most recent first)
      
      // On first load or when bot changes, always select most recent session
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
  }, [botId, sessionsLoading, sessions, currentSessionId]);

  // Reset initialization flag when bot changes
  useEffect(() => {
    sessionsInitializedRef.current = false;
  }, [botId]);

  // Prefetch chat history when session changes
  useEffect(() => {
    if (botId && currentSessionId && currentSessionId > 0) {
      queryClient.prefetchQuery({
        queryKey: queryKeys.chat.history(botId, currentSessionId),
      });
    }
  }, [botId, currentSessionId, queryClient]);

  const handleSessionSelect = useCallback(
    async (sessionId: number) => {
      if (sessionId === currentSessionId || !botId) {
        return;
      }

      // Optimistically update session ID immediately
      setCurrentSessionId(sessionId);

      // Load chat history
      const history = await queryClient.fetchQuery({
        queryKey: queryKeys.chat.history(botId, sessionId),
        queryFn: async () => {
          const { ChatService } = await import('../services/chat.service.js');
          return ChatService.getChatHistory(botId, sessionId);
        },
      });
      
      return history;
    },
    [botId, currentSessionId, queryClient]
  );

  const handleNewSession = useCallback(async () => {
    if (!botId) return;
    
    try {
      const newSession = await createSessionMutation.mutateAsync(botId);
      // Select the new session
      setCurrentSessionId(newSession.id);
      return newSession;
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  }, [botId, createSessionMutation]);

  const handleSessionDelete = useCallback(
    async (sessionId: number, onConfirm?: () => Promise<boolean>) => {
      if (!botId) return;

      // If confirmation callback provided, use it
      if (onConfirm) {
        const confirmed = await onConfirm();
        if (!confirmed) {
          return;
        }
      }

      const wasCurrentSession = currentSessionId === sessionId;

      try {
        await deleteSessionMutation.mutateAsync({ botId, sessionId });

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
    [botId, currentSessionId, sessions, deleteSessionMutation, handleSessionSelect]
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
