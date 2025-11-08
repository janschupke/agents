import { useState, useEffect, useRef, useCallback } from 'react';
import { Bot, Embedding } from '../types/chat.types.js';
import { BotService } from '../services/bot.service.js';
import { IconClose } from './Icons';
import { SkeletonList } from './Skeleton';

interface BotConfigFormProps {
  bot: Bot | null;
  onSave: (savedBot: Bot) => void;
}

export default function BotConfigForm({ bot, onSave }: BotConfigFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [embeddings, setEmbeddings] = useState<Embedding[]>([]);
  const [loadingEmbeddings, setLoadingEmbeddings] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Cache embeddings per bot ID
  const embeddingsCache = useRef<Map<number, Embedding[]>>(new Map());
  // Track which bots are currently loading embeddings
  const loadingBots = useRef<Set<number>>(new Set());

  const loadEmbeddingsLazy = useCallback(async (botId: number) => {
    // Check cache first - if we have cached data, use it instantly
    if (embeddingsCache.current.has(botId)) {
      setEmbeddings(embeddingsCache.current.get(botId)!);
      return;
    }

    // Check if already loading for this bot
    if (loadingBots.current.has(botId)) {
      return;
    }

    // Load embeddings
    loadingBots.current.add(botId);
    setLoadingEmbeddings(true);
    setError(null);
    try {
      const data = await BotService.getEmbeddings(botId);
      // Cache the embeddings
      embeddingsCache.current.set(botId, data);
      setEmbeddings(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load embeddings';
      setError(errorMessage);
      setEmbeddings([]);
    } finally {
      loadingBots.current.delete(botId);
      setLoadingEmbeddings(false);
    }
  }, []);

  // Update form fields when bot changes (instant, no API call)
  useEffect(() => {
    if (bot) {
      setName(bot.name);
      setDescription(bot.description || '');
      
      // Load embeddings lazily when bot is selected
      if (bot.id > 0) {
        loadEmbeddingsLazy(bot.id);
      } else {
        // New bot, no embeddings yet
        setEmbeddings([]);
      }
    } else {
      // No bot selected, clear form
      setName('');
      setDescription('');
      setEmbeddings([]);
    }
  }, [bot, loadEmbeddingsLazy]);

  const handleSave = async () => {
    if (!bot) return;

    if (!name.trim()) {
      setError('Bot name is required');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      let savedBot: Bot;
      
      if (bot.id < 0) {
        // Creating a new bot
        savedBot = await BotService.createBot({
          name: name.trim(),
          description: description.trim() || undefined,
        });
        // Clear cache for this new bot (it will be reloaded)
      } else {
        // Updating an existing bot
        await BotService.updateBot(bot.id, {
          name: name.trim(),
          description: description.trim() || undefined,
        });
        savedBot = {
          ...bot,
          name: name.trim(),
          description: description.trim() || undefined,
        };
      }
      
      onSave(savedBot);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to save bot';
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEmbedding = async (embeddingId: number) => {
    if (!bot || bot.id < 0) return; // Can't delete embeddings from unsaved bots

    if (!confirm('Are you sure you want to delete this embedding?')) {
      return;
    }

    setDeletingId(embeddingId);
    setError(null);
    try {
      await BotService.deleteEmbedding(bot.id, embeddingId);
      // Update cached embeddings
      const cached = embeddingsCache.current.get(bot.id) || [];
      const updated = cached.filter((e) => e.id !== embeddingId);
      embeddingsCache.current.set(bot.id, updated);
      setEmbeddings(updated);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to delete embedding';
      setError(errorMessage);
    } finally {
      setDeletingId(null);
    }
  };

  const handleRefreshEmbeddings = async () => {
    if (!bot || bot.id < 0) return;
    
    // Clear cache for this bot and reload
    embeddingsCache.current.delete(bot.id);
    loadingBots.current.delete(bot.id);
    await loadEmbeddingsLazy(bot.id);
  };

  if (!bot) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-text-tertiary text-center text-sm">
          Select a bot to configure
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-5 py-3 bg-background border-b border-border">
        <h2 className="text-lg font-semibold text-text-secondary">
          Bot Configuration
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto p-5">
        {error && (
          <div className="mb-4 p-2.5 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
            {error}
          </div>
        )}

        <div className="space-y-5">
          <div>
            <label
              htmlFor="bot-name"
              className="block text-sm font-medium text-text-secondary mb-1.5"
            >
              Bot Name
            </label>
            <input
              id="bot-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-8 px-3 border border-border-input rounded-md text-sm text-text-primary bg-background-secondary focus:outline-none focus:border-border-focus"
              placeholder="Enter bot name"
            />
          </div>

          <div>
            <label
              htmlFor="bot-description"
              className="block text-sm font-medium text-text-secondary mb-1.5"
            >
              Description (optional)
            </label>
            <textarea
              id="bot-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-border-input rounded-md text-sm text-text-primary bg-background-secondary focus:outline-none focus:border-border-focus resize-none"
              placeholder="Enter bot description"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold text-text-secondary">
                Embeddings
              </h3>
              {bot.id > 0 && (
                <button
                  onClick={handleRefreshEmbeddings}
                  disabled={loadingEmbeddings}
                  className="h-7 px-3 text-xs bg-background-secondary border border-border rounded-md text-text-primary hover:bg-background disabled:opacity-50 transition-colors"
                >
                  {loadingEmbeddings ? 'Loading...' : 'Refresh'}
                </button>
              )}
            </div>

            {bot.id < 0 ? (
              <div className="text-text-tertiary text-center py-6 text-sm">
                Save the bot to see embeddings
              </div>
            ) : loadingEmbeddings ? (
              <div className="space-y-2">
                <SkeletonList count={3} />
              </div>
            ) : embeddings.length === 0 ? (
              <div className="text-text-tertiary text-center py-6 text-sm">
                No embeddings found for this bot
              </div>
            ) : (
              <div className="space-y-2">
                {embeddings.map((embedding) => (
                  <div
                    key={embedding.id}
                    className="p-3 bg-background-secondary border border-border rounded-md"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-text-tertiary mb-1">
                          Session ID: {embedding.sessionId} • Created:{' '}
                          {new Date(embedding.createdAt).toLocaleString()}
                        </div>
                        <div className="text-sm text-text-primary break-words">
                          {embedding.chunk}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteEmbedding(embedding.id)}
                        disabled={deletingId === embedding.id}
                        className="h-7 px-2.5 text-xs bg-red-600 text-white border-none rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 flex-shrink-0 transition-colors"
                        title="Delete"
                      >
                        <IconClose className="w-3 h-3" />
                        {deletingId === embedding.id ? 'Deleting...' : ''}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="px-5 py-3 bg-background border-t border-border">
        <button
          onClick={handleSave}
          disabled={saving || !name.trim()}
          className="h-8 px-4 bg-primary text-text-inverse border-none rounded-md text-sm font-medium cursor-pointer transition-colors hover:bg-primary-hover disabled:bg-disabled disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : bot.id < 0 ? 'Create Bot' : 'Save'}
        </button>
      </div>
    </div>
  );
}
