import { useState, useEffect } from 'react';
import { Bot, Embedding } from '../types/chat.types.js';
import { BotService } from '../services/bot.service.js';

interface BotConfigFormProps {
  bot: Bot | null;
  onSave: (savedBot: Bot) => void;
}

export default function BotConfigForm({ bot, onSave }: BotConfigFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [embeddings, setEmbeddings] = useState<Embedding[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (bot) {
      setName(bot.name);
      setDescription(bot.description || '');
      // Only load embeddings for saved bots (positive IDs)
      if (bot.id > 0) {
        loadEmbeddings();
      } else {
        // New bot, no embeddings yet
        setEmbeddings([]);
      }
    }
  }, [bot]);

  const loadEmbeddings = async () => {
    if (!bot || bot.id < 0) return; // Can't load embeddings for unsaved bots

    setLoading(true);
    setError(null);
    try {
      const data = await BotService.getEmbeddings(bot.id);
      setEmbeddings(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load embeddings';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

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
      setEmbeddings((prev) => prev.filter((e) => e.id !== embeddingId));
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to delete embedding';
      setError(errorMessage);
    } finally {
      setDeletingId(null);
    }
  };

  if (!bot) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-text-secondary text-center">
          Select a bot to configure
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-6 py-4 bg-background border-b border-border">
        <h2 className="text-xl font-semibold text-text-secondary">
          Bot Configuration
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="space-y-6">
          <div>
            <label
              htmlFor="bot-name"
              className="block text-sm font-medium text-text-secondary mb-2"
            >
              Bot Name
            </label>
            <input
              id="bot-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-border-input rounded-md text-base text-text-primary bg-background-secondary focus:outline-none focus:border-border-focus"
              placeholder="Enter bot name"
            />
          </div>

          <div>
            <label
              htmlFor="bot-description"
              className="block text-sm font-medium text-text-secondary mb-2"
            >
              Description (optional)
            </label>
            <textarea
              id="bot-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-border-input rounded-md text-base text-text-primary bg-background-secondary focus:outline-none focus:border-border-focus resize-none"
              placeholder="Enter bot description"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-text-secondary">
                Embeddings
              </h3>
              {bot.id > 0 && (
                <button
                  onClick={loadEmbeddings}
                  disabled={loading}
                  className="px-3 py-1 text-sm bg-background-secondary border border-border rounded-md text-text-primary hover:bg-background disabled:opacity-50"
                >
                  {loading ? 'Loading...' : 'Refresh'}
                </button>
              )}
            </div>

            {bot.id < 0 ? (
              <div className="text-text-secondary text-center py-8">
                Save the bot to see embeddings
              </div>
            ) : loading ? (
              <div className="text-text-secondary text-center py-8">
                Loading embeddings...
              </div>
            ) : embeddings.length === 0 ? (
              <div className="text-text-secondary text-center py-8">
                No embeddings found for this bot
              </div>
            ) : (
              <div className="space-y-2">
                {embeddings.map((embedding) => (
                  <div
                    key={embedding.id}
                    className="p-4 bg-background-secondary border border-border rounded-md"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-text-secondary mb-1">
                          Session ID: {embedding.sessionId} • Created:{' '}
                          {new Date(embedding.createdAt).toLocaleString()}
                        </div>
                        <div className="text-text-primary break-words">
                          {embedding.chunk}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteEmbedding(embedding.id)}
                        disabled={deletingId === embedding.id}
                        className="px-3 py-1 text-sm bg-red-600 text-white border-none rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                      >
                        {deletingId === embedding.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="px-6 py-4 bg-background border-t border-border">
        <button
          onClick={handleSave}
          disabled={saving || !name.trim()}
          className="px-6 py-2 bg-primary text-text-inverse border-none rounded-md text-base font-medium cursor-pointer transition-colors hover:bg-primary-hover disabled:bg-disabled disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : bot.id < 0 ? 'Create Bot' : 'Save'}
        </button>
      </div>
    </div>
  );
}
