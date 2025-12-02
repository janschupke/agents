import { useState } from 'react';
import { Bot } from '../../../types/chat.types.js';
import { useCreateBot, useUpdateBot, useDeleteBot } from '../../../hooks/mutations/use-bot-mutations.js';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../../hooks/queries/query-keys.js';
import { useConfirm } from '../../../hooks/useConfirm';
import { BotFormValues } from './use-bot-form.js';

// Temporary bot ID for new bots (negative to indicate not saved)
let tempBotIdCounter = -1;

interface UseBotConfigOperationsOptions {
  contextBots: Bot[];
  localBots: Bot[];
  setLocalBots: React.Dispatch<React.SetStateAction<Bot[]>>;
  currentBotId: number | null;
  setCurrentBotId: (botId: number | null) => void;
}

interface UseBotConfigOperationsReturn {
  handleSave: (bot: Bot, values: BotFormValues) => Promise<Bot | null>;
  handleDelete: (botId: number) => Promise<void>;
  handleNewBot: () => void;
  saving: boolean;
}

/**
 * Manages bot CRUD operations (create, update, delete)
 */
export function useBotConfigOperations({
  contextBots,
  localBots,
  setLocalBots,
  currentBotId,
  setCurrentBotId,
}: UseBotConfigOperationsOptions): UseBotConfigOperationsReturn {
  const { confirm } = useConfirm();
  const queryClient = useQueryClient();
  const createBotMutation = useCreateBot();
  const updateBotMutation = useUpdateBot();
  const deleteBotMutation = useDeleteBot();

  const handleSave = async (bot: Bot, values: BotFormValues): Promise<Bot | null> => {
    if (!bot) return null;

    const validRules = values.behaviorRules.filter((rule) => rule.trim().length > 0);
    const configs = {
      temperature: values.temperature,
      system_prompt: values.systemPrompt.trim() || undefined,
      behavior_rules: validRules.length > 0 ? validRules : undefined,
    };

    try {
      if (bot.id < 0) {
        // Creating a new bot
        const result = await createBotMutation.mutateAsync({
          name: values.name.trim(),
          description: values.description.trim() || undefined,
          avatarUrl: values.avatarUrl || undefined,
          configs,
        });
        // Remove from localBots if it was there
        setLocalBots((prev) => prev.filter((b) => b.id !== bot.id));
        // Update currentBotId to the saved bot's real ID
        if (result.id > 0) {
          setCurrentBotId(result.id);
        }
        return result;
      } else {
        // Updating an existing bot
        await updateBotMutation.mutateAsync({
          botId: bot.id,
          data: {
            name: values.name.trim(),
            description: values.description.trim() || undefined,
            avatarUrl: values.avatarUrl || undefined,
            configs,
          },
        });
        // Get updated bot from cache
        const updatedBot = queryClient.getQueryData<Bot>(queryKeys.bots.detail(bot.id));
        if (updatedBot) {
          return updatedBot;
        } else {
          return {
            ...bot,
            name: values.name.trim(),
            description: values.description.trim() || null,
            avatarUrl: values.avatarUrl || null,
          };
        }
      }
    } catch (error) {
      // Error is handled by mutation hook (toast notification)
      console.error('Failed to save bot:', error);
      return null;
    }
  };

  const handleDelete = async (botId: number) => {
    const allBots = [...contextBots, ...localBots];
    const bot = allBots.find((b) => b.id === botId);
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

  const saving = createBotMutation.isPending || updateBotMutation.isPending;

  return {
    handleSave,
    handleDelete,
    handleNewBot,
    saving,
  };
}
