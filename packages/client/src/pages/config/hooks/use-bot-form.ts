import { useEffect, useMemo, useRef } from 'react';
import { Bot } from '../../../types/chat.types';
import { useFormValidation } from '../../../hooks/use-form-validation';
import { validationRules } from '../../../utils/validation';
import { parseBehaviorRules } from '../utils/bot.utils';

export interface BotFormValues extends Record<string, unknown> {
  name: string;
  description: string;
  avatarUrl: string | null;
  temperature: number;
  systemPrompt: string;
  behaviorRules: string[];
}

interface UseBotFormOptions {
  bot: Bot | null;
  botData: Bot | null;
}

interface UseBotFormReturn {
  values: BotFormValues;
  errors: Partial<Record<keyof BotFormValues, string | null>>;
  touched: Partial<Record<keyof BotFormValues, boolean>>;
  setValue: <K extends keyof BotFormValues>(field: K, value: BotFormValues[K]) => void;
  setTouched: (field: keyof BotFormValues) => void;
  validateAll: () => { isValid: boolean; errors: Partial<Record<keyof BotFormValues, string>> };
  reset: () => void;
}

/**
 * Manages form state and validation for bot configuration
 */
export function useBotForm({ bot, botData }: UseBotFormOptions): UseBotFormReturn {
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

  // Track previous bot/botData IDs to prevent unnecessary updates
  const prevBotIdRef = useRef<number | null>(bot?.id ?? null);
  const prevBotDataIdRef = useRef<number | null>(botData?.id ?? null);

  // Update form when bot or botData changes
  useEffect(() => {
    const currentBotId = bot?.id ?? null;
    const currentBotDataId = botData?.id ?? null;

    // Only update if bot or botData ID actually changed
    if (
      prevBotIdRef.current === currentBotId &&
      prevBotDataIdRef.current === currentBotDataId
    ) {
      return;
    }

    prevBotIdRef.current = currentBotId;
    prevBotDataIdRef.current = currentBotDataId;

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
    // Note: setValue and reset are intentionally excluded from deps to prevent infinite loops
    // They are stable enough for this use case (only called when bot/botData IDs change)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bot?.id, botData?.id]);

  return {
    values,
    errors,
    touched,
    setValue,
    setTouched,
    validateAll,
    reset,
  };
}
