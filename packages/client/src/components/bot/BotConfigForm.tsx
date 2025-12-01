import { useState, useEffect, useRef, useCallback } from 'react';
import { Bot, AgentMemory } from '../../types/chat.types.js';
import { BotService } from '../../services/bot.service.js';
import { MemoryService } from '../../services/memory.service.js';
import PageHeader from '../ui/PageHeader.js';
import { Skeleton } from '../ui/Skeleton';
import { IconRefresh } from '../ui/Icons';
import { useBots } from '../../contexts/BotContext.js';
import { useConfirm } from '../../hooks/useConfirm';
import AvatarPicker from '../ui/AvatarPicker.js';
import {
  NameField,
  DescriptionField,
  TemperatureField,
  SystemPromptField,
  BehaviorRulesField,
} from './BotConfigFormFields';
import MemoriesList from './MemoriesList';

interface BotConfigFormProps {
  bot: Bot | null;
  onSave: (savedBot: Bot) => void;
}

export default function BotConfigForm({ bot, onSave }: BotConfigFormProps) {
  const { getCachedBotConfig, setCachedBotConfig } = useBots();
  const { confirm, ConfirmDialog } = useConfirm();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [temperature, setTemperature] = useState(0.7);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [behaviorRules, setBehaviorRules] = useState<string[]>([]);
  const [memories, setMemories] = useState<AgentMemory[]>([]);
  const [loadingMemories, setLoadingMemories] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Track which bots are currently loading memories
  const loadingBots = useRef<Set<number>>(new Set());

  // Load memories - always refresh, never cache
  const loadMemoriesLazy = useCallback(async (botId: number) => {
    // Check if already loading for this bot
    if (loadingBots.current.has(botId)) {
      return;
    }

    // Load memories (always fetch, no cache)
    loadingBots.current.add(botId);
    setLoadingMemories(true);
    setError(null);
    try {
      const data = await MemoryService.getMemories(botId);
      setMemories(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load memories';
      setError(errorMessage);
      setMemories([]);
    } finally {
      loadingBots.current.delete(botId);
      setLoadingMemories(false);
    }
  }, []);

  // Helper to parse behavior rules
  const parseBehaviorRules = useCallback((behavior_rules: unknown): string[] => {
    if (!behavior_rules) return [];

    if (typeof behavior_rules === 'string') {
      try {
        const parsed = JSON.parse(behavior_rules);
        if (Array.isArray(parsed)) {
          return parsed.map((r) => String(r));
        } else if (
          typeof parsed === 'object' &&
          parsed !== null &&
          'rules' in parsed &&
          Array.isArray((parsed as { rules: unknown }).rules)
        ) {
          return (parsed as { rules: unknown[] }).rules.map((r: unknown) => String(r));
        } else {
          return [String(parsed)];
        }
      } catch {
        return [behavior_rules];
      }
    } else if (Array.isArray(behavior_rules)) {
      return behavior_rules.map((r: unknown) => String(r));
    } else if (
      typeof behavior_rules === 'object' &&
      behavior_rules !== null &&
      'rules' in behavior_rules &&
      Array.isArray((behavior_rules as { rules: unknown }).rules)
    ) {
      const rulesObj = behavior_rules as { rules: unknown[] };
      return rulesObj.rules.map((r: unknown) => String(r));
    } else {
      return [String(behavior_rules)];
    }
  }, []);

  // Update form fields when bot changes
  useEffect(() => {
    if (bot) {
      setName(bot.name);
      setDescription(bot.description || '');
      setAvatarUrl(bot.avatarUrl || null);

      // Load config and memories for existing bots
      if (bot.id > 0) {
        // Check cache first
        const cached = getCachedBotConfig(bot.id);
        if (cached) {
          // Use cached config - no loading needed
          setTemperature(cached.temperature);
          setSystemPrompt(cached.system_prompt);
          setBehaviorRules(cached.behavior_rules);
          setLoadingConfig(false);
        } else {
          // Load bot with config from API
          setLoadingConfig(true);
          BotService.getBot(bot.id)
            .then((botData: Bot) => {
              // Extract config from bot data if available
              if (botData.configs) {
                const config = botData.configs;
                const temp = typeof config.temperature === 'number' ? config.temperature : 0.7;
                const prompt = typeof config.system_prompt === 'string' ? config.system_prompt : '';
                const rules = parseBehaviorRules(config.behavior_rules);

                setTemperature(temp);
                setSystemPrompt(prompt);
                setBehaviorRules(rules);

                // Cache the config
                setCachedBotConfig(bot.id, {
                  temperature: temp,
                  system_prompt: prompt,
                  behavior_rules: rules,
                });
              } else {
                // Reset to defaults
                const defaults = { temperature: 0.7, system_prompt: '', behavior_rules: [] };
                setTemperature(defaults.temperature);
                setSystemPrompt(defaults.system_prompt);
                setBehaviorRules(defaults.behavior_rules);
                setCachedBotConfig(bot.id, defaults);
              }
            })
            .catch((err) => {
              console.error('Failed to load bot config:', err);
              // Reset to defaults on error
              const defaults = { temperature: 0.7, system_prompt: '', behavior_rules: [] };
              setTemperature(defaults.temperature);
              setSystemPrompt(defaults.system_prompt);
              setBehaviorRules(defaults.behavior_rules);
            })
            .finally(() => {
              setLoadingConfig(false);
            });
        }

        // Always refresh memories (no cache)
        loadMemoriesLazy(bot.id);
      } else {
        // New bot, reset to defaults
        setLoadingConfig(false);
        setTemperature(0.7);
        setSystemPrompt('');
        setBehaviorRules([]);
        setMemories([]);
      }
    } else {
      // No bot selected, clear form
      setName('');
      setDescription('');
      setAvatarUrl(null);
      setTemperature(0.7);
      setSystemPrompt('');
      setBehaviorRules([]);
      setMemories([]);
    }
  }, [bot, loadMemoriesLazy, getCachedBotConfig, setCachedBotConfig, parseBehaviorRules]);

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
          avatarUrl: avatarUrl || undefined,
          configs,
        });
        // Clear cache for this new bot (it will be reloaded)
      } else {
        // Updating an existing bot
        await BotService.updateBot(bot.id, {
          name: name.trim(),
          description: description.trim() || undefined,
          avatarUrl: avatarUrl || undefined,
          configs,
        });
        savedBot = {
          ...bot,
          name: name.trim(),
          description: description.trim() || null,
          avatarUrl: avatarUrl || null,
        };
      }

      // Update bot config cache (lastUpdated is added automatically)
      if (savedBot.id > 0) {
        const validRules = behaviorRules.filter((rule) => rule.trim().length > 0);
        setCachedBotConfig(savedBot.id, {
          temperature,
          system_prompt: systemPrompt.trim(),
          behavior_rules: validRules,
        });
      }

      onSave(savedBot);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save bot';
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMemory = async (memoryId: number) => {
    if (!bot || bot.id < 0) return; // Can't delete memories from unsaved bots

    const confirmed = await confirm({
      title: 'Delete Memory',
      message: 'Are you sure you want to delete this memory?',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      confirmVariant: 'danger',
    });

    if (!confirmed) {
      return;
    }

    setDeletingId(memoryId);
    setError(null);
    try {
      await MemoryService.deleteMemory(bot.id, memoryId);
      // Reload memories (always refresh)
      const updated = memories.filter((m) => m.id !== memoryId);
      setMemories(updated);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete memory';
      setError(errorMessage);
    } finally {
      setDeletingId(null);
    }
  };

  const handleEditMemory = async (memoryId: number, newKeyPoint: string) => {
    if (!bot || bot.id < 0) return;

    setEditingId(memoryId);
    setError(null);
    try {
      const updated = await MemoryService.updateMemory(bot.id, memoryId, newKeyPoint);
      // Update memory in list
      const updatedMemories = memories.map((m) =>
        m.id === memoryId ? updated : m
      );
      setMemories(updatedMemories);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update memory';
      setError(errorMessage);
    } finally {
      setEditingId(null);
    }
  };

  const handleRefreshMemories = async () => {
    if (!bot || bot.id < 0) return;

    // Always reload memories (no cache)
    loadingBots.current.delete(bot.id);
    await loadMemoriesLazy(bot.id);
  };

  if (!bot) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-text-tertiary text-center text-sm">Select a bot to configure</div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <PageHeader
        title="Bot Configuration"
        actions={
          <button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="h-8 px-4 bg-primary text-text-inverse border-none rounded-md text-sm font-medium cursor-pointer transition-colors hover:bg-primary-hover disabled:bg-disabled disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : bot.id < 0 ? 'Create Bot' : 'Save'}
          </button>
        }
      />
      <div className="flex-1 overflow-y-auto p-5">
        {error && (
          <div className="mb-4 p-2.5 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
            {error}
          </div>
        )}

        {loadingConfig ? (
          <div className="space-y-5">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <Skeleton className="h-4 w-16 mb-1.5" />
                <Skeleton className="h-24 w-24 rounded-md" />
              </div>
              <div className="flex-1">
                <Skeleton className="h-4 w-20 mb-1.5" />
                <Skeleton className="h-8 w-full" />
              </div>
            </div>
            <div>
              <Skeleton className="h-4 w-24 mb-1.5" />
              <Skeleton className="h-20 w-full" />
            </div>
            <div>
              <Skeleton className="h-4 w-32 mb-1.5" />
              <Skeleton className="h-2 w-full" />
            </div>
            <div>
              <Skeleton className="h-4 w-28 mb-1.5" />
              <Skeleton className="h-24 w-full" />
            </div>
            <div>
              <Skeleton className="h-4 w-32 mb-1.5" />
              <Skeleton className="h-10 w-full mb-2" />
              <Skeleton className="h-8 w-full" />
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Avatar and Name row */}
            <div className="flex items-start gap-4">
              <AvatarPicker
                value={avatarUrl}
                onChange={setAvatarUrl}
              />
              <div className="flex-1">
                <NameField value={name} onChange={setName} autoFocus={bot.id < 0} botId={bot.id} />
              </div>
            </div>
            <DescriptionField value={description} onChange={setDescription} />
            <TemperatureField value={temperature} onChange={setTemperature} />
            <SystemPromptField value={systemPrompt} onChange={setSystemPrompt} />
            <BehaviorRulesField rules={behaviorRules} onChange={setBehaviorRules} />

            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold text-text-secondary">Memories</h3>
                {bot.id > 0 && (
                  <button
                    onClick={handleRefreshMemories}
                    disabled={loadingMemories}
                    className="h-6 w-6 flex items-center justify-center text-text-tertiary hover:text-text-primary hover:bg-background-tertiary rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Refresh memories"
                  >
                    <IconRefresh className={`w-4 h-4 ${loadingMemories ? 'animate-spin' : ''}`} />
                  </button>
                )}
              </div>
              <MemoriesList
                memories={memories}
                loading={loadingMemories}
                editingId={editingId}
                deletingId={deletingId}
                onEdit={handleEditMemory}
                onDelete={handleDeleteMemory}
                onRefresh={handleRefreshMemories}
                botId={bot.id}
              />
            </div>
          </div>
        )}
      </div>
      {ConfirmDialog}
    </div>
  );
}
