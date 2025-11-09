import { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useChatContext } from '../contexts/ChatContext';
import { Session } from '../types/chat.types';

interface UseChatAutoLoadOptions {
  actualBotId: number | null;
  loadingBots: boolean;
  getBotSessions: (botId: number) => Session[] | undefined;
}

/**
 * Custom hook to automatically load chat history when bot or session changes
 * Handles bot changes, session validation, and prevents unnecessary reloads
 */
export function useChatAutoLoad({
  actualBotId,
  loadingBots,
  getBotSessions,
}: UseChatAutoLoadOptions): void {
  const { isSignedIn, isLoaded } = useAuth();
  const {
    messages,
    currentBotId,
    currentSessionId,
    setCurrentSessionId,
    setMessages,
    loadingMessages,
    loadChatHistory,
  } = useChatContext();

  // Track the last loaded bot/session combination to avoid unnecessary refetches
  const lastLoadedRef = useRef<{ botId: number | null; sessionId: number | null }>({
    botId: null,
    sessionId: null,
  });

  // When bot or session changes, handle accordingly
  useEffect(() => {
    if (actualBotId && isSignedIn && isLoaded && !loadingBots) {
      const botChanged = currentBotId !== null && currentBotId !== actualBotId;
      const sessionChanged = lastLoadedRef.current.sessionId !== currentSessionId;
      const botChangedFromLastLoad = lastLoadedRef.current.botId !== actualBotId;

      // If bot changed, clear session and messages immediately
      if (botChanged) {
        setCurrentSessionId(null);
        setMessages([]);
        lastLoadedRef.current = { botId: null, sessionId: null };
        // Don't auto-load - wait for user to select a session
        return;
      }

      // Auto-load if we have a session for the current bot
      if (currentSessionId && actualBotId) {
        // Check if session belongs to this bot (sessions might not be loaded yet)
        const botSessions = getBotSessions(actualBotId) || [];

        // If sessions are loaded, validate the session belongs to the bot
        if (botSessions.length > 0) {
          const sessionBelongsToBot = botSessions.some((s) => s.id === currentSessionId);

          if (!sessionBelongsToBot) {
            // Session doesn't belong to this bot, clear it
            setCurrentSessionId(null);
            setMessages([]);
            lastLoadedRef.current = { botId: null, sessionId: null };
            return;
          }
        }

        // Check if we need to load:
        // 1. Bot or session changed from last load, OR
        // 2. No messages loaded and bot/session matches
        const needsLoad =
          botChangedFromLastLoad ||
          sessionChanged ||
          (messages.length === 0 && currentBotId === actualBotId);

        if (needsLoad && !loadingMessages) {
          // Update ref before loading to prevent duplicate loads
          lastLoadedRef.current = { botId: actualBotId, sessionId: currentSessionId };
          loadChatHistory(actualBotId, currentSessionId);
        } else if (!needsLoad && currentBotId === actualBotId) {
          // Bot/session matches and we have messages - preserve them
          // Update ref to track current state
          lastLoadedRef.current = { botId: actualBotId, sessionId: currentSessionId };
        }
      } else if (currentBotId === actualBotId && messages.length > 0) {
        // No session selected but we have messages for this bot - preserve them
        lastLoadedRef.current = { botId: actualBotId, sessionId: null };
      }
    }
  }, [
    actualBotId,
    isSignedIn,
    isLoaded,
    loadingBots,
    currentBotId,
    currentSessionId,
    messages.length,
    loadingMessages,
    loadChatHistory,
    setCurrentSessionId,
    setMessages,
    getBotSessions,
  ]);
}
