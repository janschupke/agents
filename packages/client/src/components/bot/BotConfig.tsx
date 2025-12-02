import { useState, useEffect, useRef } from 'react';
import { Bot } from '../../types/chat.types.js';
import BotSidebar from './BotSidebar.js';
import BotConfigForm from './BotConfigForm.js';
import PageContainer from '../ui/PageContainer.js';
import { useConfirm } from '../../hooks/useConfirm';
import { LocalStorageManager } from '../../utils/localStorage';
import { useBots } from '../../hooks/queries/use-bots.js';
import { useDeleteBot } from '../../hooks/mutations/use-bot-mutations.js';
import LoadingWrapper from '../ui/LoadingWrapper.js';

// Temporary bot ID for new bots (negative to indicate not saved)
let tempBotIdCounter = -1;

export default function BotConfig() {
  const { confirm, ConfirmDialog } = useConfirm();
  const { data: contextBots = [], isLoading: loadingBots } = useBots();
  const deleteBotMutation = useDeleteBot();
  const [localBots, setLocalBots] = useState<Bot[]>([]);
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

  const handleBotSelect = (botId: number) => {
    // Validate bot exists before selecting
    const allBots = [...contextBots, ...localBots];
    if (allBots.some((b) => b.id === botId)) {
      setCurrentBotId(botId);
    }
  };

  const handleNewBot = () => {
    const tempId = tempBotIdCounter--;
    const newBot: Bot = {
      id: tempId,
      name: '',
      description: null,
      avatarUrl: null,
      createdAt: new Date().toISOString(),
    };
    setLocalBots((prev) => [newBot, ...prev]);
    setCurrentBotId(tempId);
  };

  const handleBotSave = (savedBot: Bot) => {
    // Remove from localBots if it was there
    setLocalBots((prev) => prev.filter((b) => b.id !== savedBot.id));

    // If this was a new bot (negative ID), it's now saved with a real ID
    // The bot will appear in contextBots after React Query refetches
    // Update currentBotId to the saved bot's real ID
    if (savedBot.id > 0) {
      setCurrentBotId(savedBot.id);
    }
  };

  const handleBotDelete = async (botId: number) => {
    const bot = bots.find((b) => b.id === botId);
    if (!bot) return;

    const confirmed = await confirm({
      title: 'Delete Bot',
      message: `Are you sure you want to delete "${bot.name}"? This will delete all related data: sessions, messages, configs, and memories.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      confirmVariant: 'danger',
    });

    if (!confirmed) {
      return;
    }

    try {
      await deleteBotMutation.mutateAsync(botId);
      // Remove from localBots if it was there
      setLocalBots((prev) => prev.filter((b) => b.id !== botId));
      // If deleted bot was selected, select first available bot or clear selection
      if (currentBotId === botId) {
        const remainingBots = [...contextBots, ...localBots].filter((b) => b.id !== botId);
        if (remainingBots.length > 0) {
          setCurrentBotId(remainingBots[0].id);
        } else {
          setCurrentBotId(null);
        }
      }
    } catch (error) {
      // Error is handled by mutation hook (toast notification)
      console.error('Failed to delete bot:', error);
    }
  };

  const currentBot = bots.find((b) => b.id === currentBotId) || null;

  return (
    <PageContainer>
      <div className="flex h-full">
        <LoadingWrapper isLoading={loadingBots} loadingText="Loading bots...">
          <BotSidebar
            bots={bots}
            currentBotId={currentBotId}
            onBotSelect={handleBotSelect}
            onNewBot={handleNewBot}
            onBotDelete={handleBotDelete}
            loading={loadingBots}
          />
        </LoadingWrapper>
        <div className="flex-1 flex flex-col overflow-hidden">
          <BotConfigForm bot={currentBot} onSave={handleBotSave} />
        </div>
      </div>
      {ConfirmDialog}
    </PageContainer>
  );
}
