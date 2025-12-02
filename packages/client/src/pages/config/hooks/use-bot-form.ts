import { useEffect, useMemo } from 'react';
import { Bot } from '../../../types/chat.types.js';
import { useFormValidation } from '../../../hooks/use-form-validation.js';
import { validationRules } from '../../../utils/validation.js';
import { parseBehaviorRules } from '../utils/bot.utils.js';

export interface BotFormValues {
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
  errors: Partial<Record<keyof BotFormValues, string>>;
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
