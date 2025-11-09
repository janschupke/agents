import { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Bot } from '../types/chat.types';

interface UseBotInitializationOptions {
  propBotId?: number;
  bots: Bot[];
  loadingBots: boolean;
  selectedBotId: number | null;
  setSelectedBotId: (botId: number | null) => void;
}

/**
 * Custom hook to handle bot initialization and validation
 * Manages bot selection when bots load, validates stored bot selection,
 * and ensures selected bot still exists
 */
export function useBotInitialization({
  propBotId,
  bots,
  loadingBots,
  selectedBotId,
  setSelectedBotId,
}: UseBotInitializationOptions): void {
  const { isSignedIn, isLoaded } = useAuth();
  const initializedRef = useRef(false);
  const botsLoadedRef = useRef(false);

  // Use propBotId if provided, otherwise validate and use persisted selectedBotId, otherwise use first bot
  useEffect(() => {
    if (propBotId) {
      setSelectedBotId(propBotId);
      initializedRef.current = true;
      return;
    }

    if (!isSignedIn || !isLoaded || loadingBots || bots.length === 0) {
      return;
    }

    // Track when bots first load
    const botsJustLoaded = !botsLoadedRef.current;
    botsLoadedRef.current = true;

    // Only initialize once when bots first load
    if (!initializedRef.current && botsJustLoaded) {
      initializedRef.current = true;

      // Read current selectedBotId from context (loaded from localStorage)
      const currentSelectedBotId = selectedBotId;

      // If we have a stored selectedBotId, validate it first
      if (currentSelectedBotId !== null) {
        const botExists = bots.some((b) => b.id === currentSelectedBotId);
        if (botExists) {
          // Valid bot, keep it - don't override
          return;
        } else {
          // Invalid bot, clear it and select first bot
          setSelectedBotId(bots[0].id);
        }
      } else {
        // No stored bot, use first bot
        setSelectedBotId(bots[0].id);
      }
    }
  }, [propBotId, isSignedIn, isLoaded, loadingBots, bots, selectedBotId, setSelectedBotId]);

  // Separate effect to validate bot still exists (after initialization)
  useEffect(() => {
    if (initializedRef.current && !loadingBots && bots.length > 0 && selectedBotId !== null) {
      if (!bots.some((b) => b.id === selectedBotId)) {
        // Bot no longer exists, clear it
        setSelectedBotId(null);
      }
    }
  }, [loadingBots, bots, selectedBotId, setSelectedBotId]);
}
