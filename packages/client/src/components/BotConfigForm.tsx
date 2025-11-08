import { useState, useEffect, useRef, useCallback } from 'react';
import { Bot, Embedding } from '../types/chat.types.js';
import { BotService } from '../services/bot.service.js';
import { IconClose, IconPlus } from './Icons';
import { SkeletonList } from './Skeleton';

interface BotConfigFormProps {
  bot: Bot | null;
  onSave: (savedBot: Bot) => void;
}

export default function BotConfigForm({ bot, onSave }: BotConfigFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [temperature, setTemperature] = useState(0.7);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [behaviorRules, setBehaviorRules] = useState<string[]>([]);
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

  // Update form fields when bot changes
  useEffect(() => {
    if (bot) {
      setName(bot.name);
      setDescription(bot.description || '');
      
      // Load config and embeddings for existing bots
      if (bot.id > 0) {
        // Load bot with config
        BotService.getBot(bot.id)
          .then((botData: any) => {
            // Extract config from bot data if available
            if (botData.config) {
              const config = botData.config;
              setTemperature(
                typeof config.temperature === 'number' ? config.temperature : 0.7
              );
              setSystemPrompt(
                typeof config.system_prompt === 'string' ? config.system_prompt : ''
              );
              // Parse behavior_rules into an array of strings
              let rulesArray: string[] = [];
              if (config.behavior_rules) {
                if (typeof config.behavior_rules === 'string') {
                  try {
                    const parsed = JSON.parse(config.behavior_rules);
                    if (Array.isArray(parsed)) {
                      rulesArray = parsed.map((r) => String(r));
                    } else if (typeof parsed === 'object' && parsed.rules && Array.isArray(parsed.rules)) {
                      rulesArray = parsed.rules.map((r: unknown) => String(r));
                    } else {
                      rulesArray = [String(parsed)];
                    }
                  } catch {
                    // If it's not valid JSON, treat as a single rule
                    rulesArray = [config.behavior_rules];
                  }
                } else if (Array.isArray(config.behavior_rules)) {
                  rulesArray = config.behavior_rules.map((r) => String(r));
                } else if (typeof config.behavior_rules === 'object' && (config.behavior_rules as any).rules) {
                  const rulesObj = config.behavior_rules as { rules: unknown[] };
                  rulesArray = rulesObj.rules.map((r) => String(r));
                } else {
                  rulesArray = [String(config.behavior_rules)];
                }
              }
              setBehaviorRules(rulesArray);
            } else {
              // Reset to defaults
              setTemperature(0.7);
              setSystemPrompt('');
              setBehaviorRules([]);
            }
          })
          .catch((err) => {
            console.error('Failed to load bot config:', err);
            // Reset to defaults on error
            setTemperature(0.7);
            setSystemPrompt('');
            setBehaviorRules([]);
          });
        
        loadEmbeddingsLazy(bot.id);
      } else {
        // New bot, reset to defaults
        setTemperature(0.7);
        setSystemPrompt('');
        setBehaviorRules([]);
        setEmbeddings([]);
      }
    } else {
      // No bot selected, clear form
      setName('');
      setDescription('');
      setTemperature(0.7);
      setSystemPrompt('');
      setBehaviorRules([]);
      setEmbeddings([]);
    }
  }, [bot, loadEmbeddingsLazy]);

  const handleSave = async () => {
    if (!bot) return;

    if (!name.trim()) {
      setError('Bot name is required');
      return;
    }

    // Convert behavior rules array to JSON
    // Filter out empty rules and create JSON array
    const validRules = behaviorRules.filter((rule) => rule.trim().length > 0);
    const parsedBehaviorRules = validRules.length > 0 ? validRules : undefined;

    setSaving(true);
    setError(null);
    try {
      let savedBot: Bot;
      
      const configs = {
        temperature,
        system_prompt: systemPrompt.trim() || undefined,
        behavior_rules: parsedBehaviorRules || undefined,
      };
      
      if (bot.id < 0) {
        // Creating a new bot
        savedBot = await BotService.createBot({
          name: name.trim(),
          description: description.trim() || undefined,
          configs,
        });
        // Clear cache for this new bot (it will be reloaded)
      } else {
        // Updating an existing bot
        await BotService.updateBot(bot.id, {
          name: name.trim(),
          description: description.trim() || undefined,
          configs,
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
            <label
              htmlFor="bot-temperature"
              className="block text-sm font-medium text-text-secondary mb-1.5"
            >
              Temperature: <span className="font-mono">{temperature.toFixed(2)}</span>
            </label>
            <div className="relative">
              <input
                id="bot-temperature"
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full h-2 bg-background-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                style={{
                  background: `linear-gradient(to right, rgb(59, 130, 246) 0%, rgb(59, 130, 246) ${(temperature / 2) * 100}%, rgb(229, 231, 235) ${(temperature / 2) * 100}%, rgb(229, 231, 235) 100%)`,
                }}
              />
            </div>
            <div className="flex justify-between text-xs text-text-tertiary mt-1">
              <span>0 (Deterministic)</span>
              <span>1 (Balanced)</span>
              <span>2 (Creative)</span>
            </div>
          </div>

          <div>
            <label
              htmlFor="bot-system-prompt"
              className="block text-sm font-medium text-text-secondary mb-1.5"
            >
              System Prompt
            </label>
            <textarea
              id="bot-system-prompt"
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-border-input rounded-md text-sm text-text-primary bg-background-secondary focus:outline-none focus:border-border-focus resize-none font-mono"
              placeholder="Enter system prompt for the bot"
            />
            <p className="text-xs text-text-tertiary mt-1">
              This prompt defines the bot's role and behavior
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              Behavior Rules
            </label>
            <div className="space-y-2">
              {behaviorRules.map((rule, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={rule}
                    onChange={(e) => {
                      const newRules = [...behaviorRules];
                      newRules[index] = e.target.value;
                      setBehaviorRules(newRules);
                    }}
                    className="flex-1 h-8 px-3 border border-border-input rounded-md text-sm text-text-primary bg-background-secondary focus:outline-none focus:border-border-focus"
                    placeholder={`Rule ${index + 1}`}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const newRules = behaviorRules.filter((_, i) => i !== index);
                      setBehaviorRules(newRules);
                    }}
                    className="h-8 w-8 flex items-center justify-center bg-red-600 text-white border-none rounded-md hover:bg-red-700 transition-colors flex-shrink-0"
                    title="Remove rule"
                  >
                    <IconClose className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setBehaviorRules([...behaviorRules, ''])}
                className="w-full h-8 px-3 bg-background-secondary border border-border rounded-md text-sm text-text-primary hover:bg-background transition-colors flex items-center justify-center gap-1.5"
              >
                <IconPlus className="w-4 h-4" />
                <span>Add Rule</span>
              </button>
            </div>
            <p className="text-xs text-text-tertiary mt-2">
              Rules will be saved as a JSON array
            </p>
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
