import { useState, useEffect } from 'react';
import { Bot } from '../types/chat.types.js';
import { BotService } from '../services/bot.service.js';
import BotSidebar from './BotSidebar.js';
import BotConfigForm from './BotConfigForm.js';

export default function BotConfig() {
  const [bots, setBots] = useState<Bot[]>([]);
  const [currentBotId, setCurrentBotId] = useState<number | null>(null);
  const [currentBot, setCurrentBot] = useState<Bot | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadBots();
  }, []);

  useEffect(() => {
    if (currentBotId) {
      loadBot(currentBotId);
    } else {
      setCurrentBot(null);
    }
  }, [currentBotId]);

  const loadBots = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await BotService.getAllBots();
      setBots(data);
      if (data.length > 0 && !currentBotId) {
        setCurrentBotId(data[0].id);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load bots';
      setError(errorMessage);
      console.error('Error loading bots:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadBot = async (botId: number) => {
    try {
      const bot = await BotService.getBot(botId);
      setCurrentBot(bot);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load bot';
      setError(errorMessage);
      console.error('Error loading bot:', err);
    }
  };

  const handleBotSelect = (botId: number) => {
    setCurrentBotId(botId);
  };

  const handleNewBot = async () => {
    const name = prompt('Enter bot name:');
    if (!name || !name.trim()) {
      return;
    }

    const description = prompt('Enter bot description (optional):');

    setLoading(true);
    setError(null);
    try {
      const newBot = await BotService.createBot({
        name: name.trim(),
        description: description?.trim() || undefined,
      });
      setBots((prev) => [newBot, ...prev]);
      setCurrentBotId(newBot.id);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to create bot';
      setError(errorMessage);
      console.error('Error creating bot:', err);
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    await loadBots();
    if (currentBotId) {
      await loadBot(currentBotId);
    }
  };

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
        />
        <BotConfigForm bot={currentBot} onSave={handleSave} />
      </div>
    </div>
  );
}
