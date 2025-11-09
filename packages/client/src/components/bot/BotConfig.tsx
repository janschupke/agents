import { useState, useEffect, useRef } from 'react';
import { Bot } from '../../types/chat.types.js';
import BotSidebar from './BotSidebar.js';
import BotConfigForm from './BotConfigForm.js';
import PageContainer from '../ui/PageContainer.js';
import { useBots } from '../../contexts/BotContext.js';
import { useConfirm } from '../../hooks/useConfirm';
import { useToast } from '../../contexts/ToastContext';
import { LocalStorageManager } from '../../utils/localStorage';

// Temporary bot ID for new bots (negative to indicate not saved)
let tempBotIdCounter = -1;

export default function BotConfig() {
  const { bots: contextBots, loadingBots, refreshBots, updateBot, addBot, removeBot } = useBots();
  const { confirm, ConfirmDialog } = useConfirm();
  const { showToast } = useToast();
  const [localBots, setLocalBots] = useState<Bot[]>([]);
  // Load initial bot ID from localStorage
  const [currentBotId, setCurrentBotIdState] = useState<number | null>(() =>
    LocalStorageManager.getSelectedBotIdConfig()
  );
  const [error] = useState<string | null>(null);

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
  const loading = loadingBots;

  const handleBotSelect = (botId: number) => {
    // Validate bot exists before selecting
    const allBots = [...contextBots, ...localBots];
    if (allBots.some((b) => b.id === botId)) {
      setCurrentBotId(botId);
    }
  };

  const handleNewBot = () => {
    // Create a temporary bot object
    const tempId = tempBotIdCounter--;
    const newTempBot: Bot = {
      id: tempId,
      name: '',
      description: null,
      createdAt: new Date().toISOString(),
    };

    // Add to local bots list at the top and select it
    setLocalBots((prev) => [newTempBot, ...prev]);
    setCurrentBotId(tempId);
  };

  const handleSave = async (savedBot: Bot) => {
    // If it was a temporary bot, remove it from local state
    if (savedBot.id < 0) {
      // This shouldn't happen, but handle it just in case
      return;
    }

    // Check if this was a new bot (temp bot) or an update to existing bot
    const wasTempBot = currentBotId !== null && currentBotId < 0;

    // Optimistically update the bot in place to keep it at the top
    if (wasTempBot) {
      // Remove temp bot from local state
      setLocalBots((prev) => prev.filter((b) => b.id >= 0));
      
      // Add saved bot to context at the top (optimistic update)
      // addBot will add to top and handle duplicates
      addBot(savedBot);
      showToast('Bot created successfully', 'success');
    } else {
      // Update existing bot in context (keeps position)
      updateBot(savedBot);
      showToast('Bot updated successfully', 'success');
    }

    // Note: Bot config cache is updated in BotConfigForm when saved

    // Select the saved bot immediately (optimistic)
    setCurrentBotId(savedBot.id);

    // Refresh bots in background to ensure we have the latest data from server (including sessions)
    // The bot is already in context at the top, so refresh will update it in place
    // Since server returns newest first, it will stay at the top
    refreshBots().catch((error) => {
      console.error('Failed to refresh bots:', error);
    });
  };

  const handleBotDelete = async (botId: number) => {
    // Find the bot to get its name for confirmation
    const botToDelete = bots.find((b) => b.id === botId);
    const botName = botToDelete?.name || 'this bot';

    // Confirm deletion
    const confirmed = await confirm({
      title: 'Delete Bot',
      message: `Are you sure you want to delete "${botName}"? This will permanently delete the bot and all its sessions, messages, and configurations.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      confirmVariant: 'danger',
    });

    if (!confirmed) {
      return;
    }

    // Optimistically remove from UI immediately
    const allBots = [...contextBots, ...localBots];
    const wasCurrentBot = currentBotId === botId;

    // Remove temporary bot from local list
    if (botId < 0) {
      setLocalBots((prev) => prev.filter((b) => b.id !== botId));
    } else {
      // Optimistically remove from context immediately
      removeBot(botId);
    }

    // Select first bot in list if we deleted the current one
    if (wasCurrentBot) {
      const remainingBots = allBots.filter((b) => b.id !== botId);
      if (remainingBots.length > 0) {
        setCurrentBotId(remainingBots[0].id);
      } else {
        setCurrentBotId(null);
      }
    }

    // Delete from API in background (only for saved bots)
    if (botId >= 0) {
      try {
        const { BotService } = await import('../../services/bot.service.js');
        await BotService.deleteBot(botId);
        // Refresh bots list to ensure UI is in sync with server
        await refreshBots();
        showToast('Bot deleted successfully', 'success');
      } catch (error) {
        console.error('Failed to delete bot:', error);
        // Revert optimistic update on error
        await refreshBots();
        showToast(`Failed to delete bot: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
      }
    }
  };

  // Get current bot from the bots list (instant, no API call)
  const currentBot = currentBotId ? bots.find((b) => b.id === currentBotId) || null : null;

  return (
    <PageContainer>
      {error && <div className="p-3 bg-red-100 border-b border-red-400 text-red-700">{error}</div>}
      <div className="flex h-full overflow-hidden">
        <BotSidebar
          bots={bots}
          currentBotId={currentBotId}
          onBotSelect={handleBotSelect}
          onNewBot={handleNewBot}
          loading={loading}
          onBotDelete={handleBotDelete}
        />
        <BotConfigForm bot={currentBot} onSave={handleSave} />
      </div>
      {ConfirmDialog}
    </PageContainer>
  );
}
