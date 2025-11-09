import { useState } from 'react';
import { Bot } from '../types/chat.types.js';
import BotSidebar from './BotSidebar.js';
import BotConfigForm from './BotConfigForm.js';
import PageContainer from './PageContainer.js';
import { useBots } from '../contexts/AppContext.js';

// Temporary bot ID for new bots (negative to indicate not saved)
let tempBotIdCounter = -1;

export default function BotConfig() {
  const {
    bots: contextBots,
    loadingBots,
    refreshBots,
    updateBotInCache,
    removeBotFromCache,
  } = useBots();
  const [localBots, setLocalBots] = useState<Bot[]>([]);
  const [currentBotId, setCurrentBotId] = useState<number | null>(null);
  const [error] = useState<string | null>(null);

  // Merge context bots with local temporary bots
  const bots = [...contextBots, ...localBots.filter((b) => b.id < 0)];
  const loading = loadingBots;

  const handleBotSelect = (botId: number) => {
    setCurrentBotId(botId);
  };

  const handleNewBot = () => {
    // Create a temporary bot object
    const tempId = tempBotIdCounter--;
    const newTempBot: Bot = {
      id: tempId,
      name: 'New Bot',
      description: null,
      createdAt: new Date().toISOString(),
    };
    
    // Add to local bots list and select it
    setLocalBots((prev) => [newTempBot, ...prev]);
    setCurrentBotId(tempId);
  };

  const handleSave = async (savedBot: Bot) => {
    // If it was a temporary bot, remove it from local state
    if (savedBot.id < 0) {
      // This shouldn't happen, but handle it just in case
      return;
    }
    
    // Remove from local bots if it was there
    setLocalBots((prev) => prev.filter((b) => b.id !== savedBot.id));
    
    // Update in context cache (bots list)
    updateBotInCache(savedBot);
    
    // Note: Bot config cache is updated in BotConfigForm when saved
    
    // Refresh bots to ensure we have the latest data from server
    await refreshBots();
    
    // Select the saved bot
    setCurrentBotId(savedBot.id);
  };

  const handleBotDelete = (botId: number) => {
    // Remove temporary bot from local list
    if (botId < 0) {
      setLocalBots((prev) => {
        const filtered = prev.filter((b) => b.id !== botId);
        // Don't auto-select another bot
        if (currentBotId === botId) {
          setCurrentBotId(null);
        }
        return filtered;
      });
    } else {
      // Remove from context cache
      removeBotFromCache(botId);
      if (currentBotId === botId) {
        setCurrentBotId(null);
      }
    }
  };

  // Get current bot from the bots list (instant, no API call)
  const currentBot = currentBotId
    ? bots.find((b) => b.id === currentBotId) || null
    : null;

  return (
    <PageContainer>
      {error && (
        <div className="p-3 bg-red-100 border-b border-red-400 text-red-700">
          {error}
        </div>
      )}
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
    </PageContainer>
  );
}
