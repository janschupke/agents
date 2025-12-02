import { useState, useEffect, useRef } from 'react';
import { Bot } from '../../types/chat.types.js';
import { LocalStorageManager } from '../../utils/localStorage';

interface UseBotSelectionOptions {
  contextBots: Bot[];
  localBots: Bot[];
  loadingBots: boolean;
}

interface UseBotSelectionReturn {
  currentBotId: number | null;
  setCurrentBotId: (botId: number | null) => void;
  bots: Bot[];
}

/**
 * Manages bot selection state and initialization logic
 */
export function useBotSelection({
  contextBots,
  localBots,
  loadingBots,
}: UseBotSelectionOptions): UseBotSelectionReturn {
  // Load initial bot ID from localStorage
  const [currentBotId, setCurrentBotIdState] = useState<number | null>(() =>
    LocalStorageManager.getSelectedBotIdConfig()
  );

  // Track if we've initialized to avoid overriding stored values
  const initializedRef = useRef(false);
  const botsLoadedRef = useRef(false);

  // Save to localStorage whenever currentBotId changes
  useEffect(() => {
    LocalStorageManager.setSelectedBotIdConfig(currentBotId);
  }, [currentBotId]);

  // Validate and initialize currentBotId when bots load
  useEffect(() => {
    if (loadingBots) {
      return;
    }

    const allBots = [...contextBots, ...localBots];

    // Track when bots first load
    const botsJustLoaded = !botsLoadedRef.current && allBots.length > 0;
    botsLoadedRef.current = allBots.length > 0;

    // Only validate/initialize once when bots first load
    if (!initializedRef.current && botsJustLoaded) {
      initializedRef.current = true;

      // Read current stored botId (loaded from localStorage)
      const storedBotId = currentBotId;

      if (storedBotId !== null) {
        // Validate stored bot exists
        const botExists = allBots.some((b) => b.id === storedBotId);
        if (!botExists) {
          // Selected bot doesn't exist, clear selection
          setCurrentBotIdState(null);
        }
        // If bot exists, keep it - don't override
      } else {
        // If no stored bot, auto-select the first bot if available
        if (allBots.length > 0) {
          setCurrentBotIdState(allBots[0].id);
        }
      }
    } else if (initializedRef.current && currentBotId !== null) {
      // After initialization, validate bot still exists
      const botExists = allBots.some((b) => b.id === currentBotId);
      if (!botExists) {
        // Bot no longer exists, select first bot if available
        if (allBots.length > 0) {
          setCurrentBotIdState(allBots[0].id);
        } else {
          setCurrentBotIdState(null);
        }
      }
    } else if (initializedRef.current && currentBotId === null && allBots.length > 0) {
      // If no bot is selected but bots are available, auto-select the first one
      setCurrentBotIdState(allBots[0].id);
    }
  }, [loadingBots, contextBots, localBots, currentBotId]);

  const setCurrentBotId = (botId: number | null) => {
    setCurrentBotIdState(botId);
    LocalStorageManager.setSelectedBotIdConfig(botId);
  };

  // Merge context bots with local temporary bots - new bots (localBots) should appear at the top
  const bots = [...localBots.filter((b) => b.id < 0), ...contextBots];

  return {
    currentBotId,
    setCurrentBotId,
    bots,
  };
}
