import { useEffect, useMemo, useState } from 'react';
import { Bot } from '../../types/chat.types.js';
import PageHeader from '../ui/PageHeader.js';
import { Skeleton } from '../ui/Skeleton';
import { IconRefresh } from '../ui/Icons';
import { useConfirm } from '../../hooks/useConfirm';
import AvatarPicker from '../ui/AvatarPicker.js';
import {
  DescriptionField,
  TemperatureField,
  SystemPromptField,
  BehaviorRulesField,
} from './BotConfigFormFields';
import MemoriesList from './MemoriesList';
import { useBot } from '../../hooks/queries/use-bots.js';
import { useBotMemories } from '../../hooks/queries/use-bots.js';
import { useCreateBot, useUpdateBot } from '../../hooks/mutations/use-bot-mutations.js';
import { useUpdateMemory, useDeleteMemory } from '../../hooks/mutations/use-bot-mutations.js';
import { useFormValidation } from '../../hooks/use-form-validation.js';
import { validationRules } from '../../utils/validation.js';
import FormButton from '../ui/FormButton.js';
import FormContainer from '../ui/FormContainer.js';
import ValidatedInput from '../ui/ValidatedInput.js';
import { ButtonType, ButtonVariant } from '../ui/form-types.js';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../hooks/queries/query-keys.js';

interface BotConfigFormProps {
  bot: Bot | null;
  onSave: (savedBot: Bot) => void;
}

interface BotFormValues {
  name: string;
  description: string;
  avatarUrl: string | null;
  temperature: number;
  systemPrompt: string;
  behaviorRules: string[];
}

// Helper to parse behavior rules
const parseBehaviorRules = (behavior_rules: unknown): string[] => {
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
};

export default function BotConfigForm({ bot, onSave }: BotConfigFormProps) {
  const { confirm, ConfirmDialog } = useConfirm();
  const queryClient = useQueryClient();

  // React Query hooks
  const { data: botData, isLoading: loadingBot } = useBot(bot?.id || null);
  const { data: memories = [], isLoading: loadingMemories } = useBotMemories(bot?.id || null);
  const createBotMutation = useCreateBot();
  const updateBotMutation = useUpdateBot();
  const updateMemoryMutation = useUpdateMemory();
  const deleteMemoryMutation = useDeleteMemory();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Initial form values
  const initialValues = useMemo<BotFormValues>(() => {
    if (bot && botData) {
      const config = botData.configs || {};
      return {
        name: bot.name,
        description: bot.description || '',
        avatarUrl: bot.avatarUrl || null,
        temperature: typeof config.temperature === 'number' ? config.temperature : 0.7,
        systemPrompt: typeof config.system_prompt === 'string' ? config.system_prompt : '',
        behaviorRules: parseBehaviorRules(config.behavior_rules),
      };
    } else if (bot && bot.id < 0) {
      // New bot
      return {
        name: bot.name || '',
        description: bot.description || '',
        avatarUrl: bot.avatarUrl || null,
        temperature: 0.7,
        systemPrompt: '',
        behaviorRules: [],
      };
    }
    return {
      name: '',
      description: '',
      avatarUrl: null,
      temperature: 0.7,
      systemPrompt: '',
      behaviorRules: [],
    };
  }, [bot, botData]);

  // Form validation
  const validationSchema = {
    name: [validationRules.required('Bot name is required')],
  };

  const {
    values,
    errors,
    touched,
    setValue,
    setTouched,
    validateAll,
    reset,
  } = useFormValidation<BotFormValues>(validationSchema, initialValues);

  // Update form when bot or botData changes
  useEffect(() => {
    if (bot && botData) {
      const config = botData.configs || {};
      setValue('name', bot.name);
      setValue('description', bot.description || '');
      setValue('avatarUrl', bot.avatarUrl || null);
      setValue('temperature', typeof config.temperature === 'number' ? config.temperature : 0.7);
      setValue('systemPrompt', typeof config.system_prompt === 'string' ? config.system_prompt : '');
      setValue('behaviorRules', parseBehaviorRules(config.behavior_rules));
    } else if (bot && bot.id < 0) {
      setValue('name', bot.name || '');
      setValue('description', bot.description || '');
      setValue('avatarUrl', bot.avatarUrl || null);
      setValue('temperature', 0.7);
      setValue('systemPrompt', '');
      setValue('behaviorRules', []);
    } else {
      reset();
    }
  }, [bot, botData, setValue, reset]);

  const saving = createBotMutation.isPending || updateBotMutation.isPending;
  const loadingConfig = loadingBot && bot !== null && bot.id > 0;

  const handleSave = async () => {
    if (!bot) return;

    // Validate form
    const validation = validateAll();
    if (!validation.isValid) {
      return;
    }

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
        onSave(result);
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
          onSave(updatedBot);
        } else {
          onSave({
            ...bot,
            name: values.name.trim(),
            description: values.description.trim() || null,
            avatarUrl: values.avatarUrl || null,
          });
        }
      }
    } catch (error) {
      // Error is handled by mutation hook (toast notification)
      console.error('Failed to save bot:', error);
    }
  };

  const handleDeleteMemory = async (memoryId: number) => {
    if (!bot || bot.id < 0) return;

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
    try {
      await deleteMemoryMutation.mutateAsync({ botId: bot.id, memoryId });
    } catch (error) {
      // Error is handled by mutation hook
      console.error('Failed to delete memory:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const handleEditMemory = async (memoryId: number, newKeyPoint: string) => {
    if (!bot || bot.id < 0) return;

    setEditingId(memoryId);
    try {
      await updateMemoryMutation.mutateAsync({
        botId: bot.id,
        memoryId,
        keyPoint: newKeyPoint,
      });
    } catch (error) {
      // Error is handled by mutation hook
      console.error('Failed to update memory:', error);
    } finally {
      setEditingId(null);
    }
  };

  const handleRefreshMemories = () => {
    if (!bot || bot.id < 0) return;
    queryClient.invalidateQueries({ queryKey: queryKeys.bots.memories(bot.id) });
  };

  if (!bot) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-text-tertiary text-center text-sm">Select a bot to configure</div>
      </div>
    );
  }

  const formError = createBotMutation.error || updateBotMutation.error;
  const errorMessage = formError && typeof formError === 'object' && 'message' in formError
    ? (formError as { message: string }).message
    : null;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <PageHeader
        title="Bot Configuration"
        actions={
          <FormButton
            type={ButtonType.BUTTON}
            onClick={handleSave}
            loading={saving}
            disabled={!values.name.trim()}
            variant={ButtonVariant.PRIMARY}
            tooltip={saving ? 'Saving...' : bot.id < 0 ? 'Create Bot' : 'Save'}
          >
            {bot.id < 0 ? 'Create Bot' : 'Save'}
          </FormButton>
        }
      />
      <div className="flex-1 overflow-y-auto p-5">
        <FormContainer saving={saving} error={errorMessage}>
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
                  value={values.avatarUrl}
                  onChange={(url) => setValue('avatarUrl', url)}
                />
                <div className="flex-1">
                  <div>
                    <label htmlFor="bot-name" className="block text-sm font-medium text-text-secondary mb-1.5">
                      Bot Name
                    </label>
                    <ValidatedInput
                      id="bot-name"
                      type="text"
                      value={values.name}
                      onChange={(e) => setValue('name', e.target.value)}
                      onBlur={() => setTouched('name')}
                      error={errors.name}
                      touched={touched.name}
                      disabled={saving}
                      className="w-full"
                      placeholder="Enter bot name"
                      autoFocus={bot.id < 0}
                    />
                  </div>
                </div>
              </div>
              <DescriptionField value={values.description} onChange={(val) => setValue('description', val)} />
              <TemperatureField value={values.temperature} onChange={(val) => setValue('temperature', val)} />
              <SystemPromptField value={values.systemPrompt} onChange={(val) => setValue('systemPrompt', val)} />
              <BehaviorRulesField rules={values.behaviorRules} onChange={(rules) => setValue('behaviorRules', rules)} />

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
        </FormContainer>
      </div>
      {ConfirmDialog}
    </div>
  );
}
