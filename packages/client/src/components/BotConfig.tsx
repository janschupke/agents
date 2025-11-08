import { useState, useEffect } from 'react';
import { Bot } from '../types/chat.types.js';
import { BotService } from '../services/bot.service.js';
import BotSidebar from './BotSidebar.js';
import BotConfigForm from './BotConfigForm.js';

// Temporary bot ID for new bots (negative to indicate not saved)
let tempBotIdCounter = -1;

export default function BotConfig() {
  const [bots, setBots] = useState<Bot[]>([]);
  const [currentBotId, setCurrentBotId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load all bots with their details on mount
  useEffect(() => {
    loadAllBots();
  }, []);

  const loadAllBots = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await BotService.getAllBots();
      // Filter out temporary bots (negative IDs) when loading from server
      setBots((prev) => {
        const tempBots = prev.filter((b) => b.id < 0);
        return [...data, ...tempBots];
      });
      // Don't preselect any bot - let user select
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load bots';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

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
    
    // Add to bots list and select it
    setBots((prev) => [newTempBot, ...prev]);
    setCurrentBotId(tempId);
  };

  const handleSave = async (savedBot: Bot) => {
    // If it was a temporary bot, remove it from the list and add the saved one
    if (savedBot.id < 0) {
      // This shouldn't happen, but handle it just in case
      return;
    }
    
    // Update the bot in the list with the saved data
    setBots((prev) => {
      const filtered = prev.filter((b) => b.id !== savedBot.id || b.id >= 0);
      return [savedBot, ...filtered.filter((b) => b.id !== savedBot.id)];
    });
    
    // Reload bots to ensure we have the latest data
    await loadAllBots();
    
    // Select the saved bot
    setCurrentBotId(savedBot.id);
  };

  const handleBotDelete = (botId: number) => {
    // Remove temporary bot from list
    if (botId < 0) {
      setBots((prev) => {
        const filtered = prev.filter((b) => b.id !== botId);
        // Don't auto-select another bot
        if (currentBotId === botId) {
          setCurrentBotId(null);
        }
        return filtered;
      });
    }
  };

  // Get current bot from the bots list (instant, no API call)
  const currentBot = currentBotId
    ? bots.find((b) => b.id === currentBotId) || null
    : null;

  return (
    <div className="flex flex-col h-full bg-background-secondary rounded-lg shadow-lg overflow-hidden">
      {error && (
        <div className="p-3 bg-red-100 border-b border-red-400 text-red-700">
          {error}
        </div>
      )}
      <div className="flex flex-1 overflow-hidden">
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
    </div>
  );
}
