import { useCallback } from 'react';
import { Message, Session } from '../types/chat.types';
import { ChatService } from '../services/chat.service';

interface UseChatHandlersOptions {
  actualBotId: number | null;
  currentSessionId: number | null;
  setCurrentSessionId: (sessionId: number | null) => void;
  setMessages: (messages: Message[]) => void;
  loadChatHistory: (botId: number, sessionId?: number) => Promise<void>;
  sendMessageToContext: (
    botId: number,
    message: string,
    sessionId?: number
  ) => Promise<{ sessionId: number | null; isNewSession: boolean }>;
  addSessionToBot: (botId: number, session: Session) => void;
  refreshBotSessions: (botId: number) => Promise<void>;
}

/**
 * Custom hook to handle chat-related user interactions
 * Provides handlers for session selection, new session creation, and message submission
 */
export function useChatHandlers({
  actualBotId,
  currentSessionId,
  setCurrentSessionId,
  setMessages,
  loadChatHistory,
  sendMessageToContext,
  addSessionToBot,
  refreshBotSessions,
}: UseChatHandlersOptions) {
  const handleSessionSelect = useCallback(
    async (sessionId: number) => {
      if (sessionId === currentSessionId || !actualBotId) {
        return;
      }

      // Optimistically update session ID immediately for instant UI feedback
      setCurrentSessionId(sessionId);

      // Clear messages to show loading state
      setMessages([]);

      // Load chat history
      await loadChatHistory(actualBotId, sessionId);
    },
    [actualBotId, currentSessionId, setCurrentSessionId, setMessages, loadChatHistory]
  );

  const handleNewSession = useCallback(async () => {
    if (!actualBotId) return;
    try {
      const newSession = await ChatService.createSession(actualBotId);

      // Immediately add to list and highlight - ensure it's added to the correct bot
      addSessionToBot(actualBotId, newSession);
      setCurrentSessionId(newSession.id);
      setMessages([]);

      // Load chat history
      await loadChatHistory(actualBotId, newSession.id);
    } catch (error) {
      console.error('Error creating session:', error);
      // Revert on error
      setCurrentSessionId(null);
    }
  }, [
    actualBotId,
    setCurrentSessionId,
    setMessages,
    loadChatHistory,
    addSessionToBot,
  ]);

  const handleSubmit = useCallback(
    async (message: string) => {
      if (!message.trim() || !actualBotId) return;

      try {
        const result = await sendMessageToContext(
          actualBotId,
          message,
          currentSessionId || undefined
        );
        // If a new session was created, add it to BotContext and refresh sessions
        if (result.isNewSession && result.sessionId && actualBotId) {
          // Get session details from ChatService to add to BotContext
          try {
            const sessions = await ChatService.getSessions(actualBotId);
            const newSession = sessions.find((s) => s.id === result.sessionId);
            if (newSession) {
              addSessionToBot(actualBotId, newSession);
            } else {
              // Fallback: refresh all sessions
              await refreshBotSessions(actualBotId);
            }
          } catch (error) {
            // Fallback: refresh all sessions if we can't get the new session
            await refreshBotSessions(actualBotId);
          }
        }
      } catch (error) {
        console.error('Error sending message:', error);
      }
    },
    [
      actualBotId,
      currentSessionId,
      sendMessageToContext,
      addSessionToBot,
      refreshBotSessions,
    ]
  );

  return {
    handleSessionSelect,
    handleNewSession,
    handleSubmit,
  };
}
