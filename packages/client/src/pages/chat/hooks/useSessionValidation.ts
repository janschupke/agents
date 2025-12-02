import { useEffect, useRef } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { Session } from '../../../types/chat.types';

interface UseSessionValidationOptions {
  selectedBotId: number | null;
  currentSessionId: number | null;
  setCurrentSessionId: (sessionId: number | null) => void;
  getBotSessions: (botId: number) => Session[] | undefined;
  loadingBots: boolean;
}

/**
 * Custom hook to validate that the selected session belongs to the selected bot
 * Clears session if it doesn't belong to the current bot
 */
export function useSessionValidation({
  selectedBotId,
  currentSessionId,
  setCurrentSessionId,
  getBotSessions,
  loadingBots,
}: UseSessionValidationOptions): void {
  const { isSignedIn, isLoaded } = useAuth();
  const sessionValidatedRef = useRef(false);

  // Validate selectedSessionId belongs to selectedBotId when sessions are available
  useEffect(() => {
    if (
      !loadingBots &&
      isSignedIn &&
      isLoaded &&
      selectedBotId !== null &&
      currentSessionId !== null
    ) {
      const botSessions = getBotSessions(selectedBotId) ?? [];

      // Only validate once sessions are loaded (not empty array)
      // Empty array might mean sessions haven't loaded yet
      if (botSessions.length > 0) {
        sessionValidatedRef.current = true;
        if (!botSessions.some((s) => s.id === currentSessionId)) {
          // Session doesn't belong to selected bot, clear it
          setCurrentSessionId(null);
        }
      } else if (sessionValidatedRef.current) {
        // Sessions were loaded before but now empty - might have been deleted
        // Only clear if we've validated before (sessions were loaded)
        setCurrentSessionId(null);
      }
    }
  }, [
    loadingBots,
    isSignedIn,
    isLoaded,
    selectedBotId,
    currentSessionId,
    getBotSessions,
    setCurrentSessionId,
  ]);
}
