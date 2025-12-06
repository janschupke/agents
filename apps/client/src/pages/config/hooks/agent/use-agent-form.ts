import { useEffect, useMemo, useRef } from 'react';
import { Agent } from '../../../../types/chat.types';
import {
  useFormValidation,
  ValidationSchema,
  validationRules,
} from '@openai/utils';
import {
  AgentType,
  Gender,
  Sentiment,
} from '../../../../types/agent.types';
import { PersonalityType, PERSONALITY_TYPES } from '@openai/shared-types';
import { useTranslation, I18nNamespace } from '@openai/i18n';

export interface AgentFormValues extends Record<string, unknown> {
  name: string;
  description: string; // This is now the system prompt (renamed)
  avatarUrl: string | null;
  agentType: AgentType;
  language: string | null;
  // New fields
  age: number | null;
  gender: Gender | null;
  personality: PersonalityType;
  sentiment: Sentiment;
  interests: string[];
}

interface UseAgentFormOptions {
  agent: Agent | null;
  agentData: Agent | null;
}

interface UseAgentFormReturn {
  values: AgentFormValues;
  errors: Partial<Record<keyof AgentFormValues, string | null>>;
  touched: Partial<Record<keyof AgentFormValues, boolean>>;
  setValue: <K extends keyof AgentFormValues>(
    field: K,
    value: AgentFormValues[K]
  ) => void;
  setTouched: (field: keyof AgentFormValues) => void;
  validateAll: () => {
    isValid: boolean;
    errors: Partial<Record<keyof AgentFormValues, string>>;
  };
  reset: () => void;
}

/**
 * Manages form state and validation for agent configuration
 */
export function useAgentForm({
  agent,
  agentData,
}: UseAgentFormOptions): UseAgentFormReturn {
  const { t } = useTranslation(I18nNamespace.CLIENT);

  // Initial form values
  const initialValues = useMemo<AgentFormValues>(() => {
    if (agent && agentData) {
      const config = agentData.configs || {};
      return {
        name: agent.name,
        description: agent.description || '',
        avatarUrl: agent.avatarUrl || null,
        agentType: agent.agentType || AgentType.GENERAL,
        language: agent.language || null,
        // New fields
        age: typeof config.age === 'number' ? config.age : null,
        gender:
          config.gender &&
          Object.values(Gender).includes(config.gender as Gender)
            ? (config.gender as Gender)
            : null,
        personality:
          config.personality &&
          PERSONALITY_TYPES.includes(config.personality as PersonalityType)
            ? (config.personality as PersonalityType)
            : 'Empathetic',
        sentiment:
          config.sentiment &&
          Object.values(Sentiment).includes(config.sentiment as Sentiment)
            ? (config.sentiment as Sentiment)
            : Sentiment.NEUTRAL,
        interests: Array.isArray(config.interests) ? config.interests : [],
      };
    } else if (agent && agent.id < 0) {
      // New agent
      return {
        name: agent.name || '',
        description: '',
        avatarUrl: agent.avatarUrl || null,
        agentType: agent.agentType || AgentType.GENERAL,
        language: agent.language || null,
        // New fields
        age: null,
        gender: null,
        personality: 'Empathetic',
        sentiment: Sentiment.NEUTRAL,
        interests: [],
      };
    }
    return {
      name: '',
      description: '',
      avatarUrl: null,
      agentType: AgentType.GENERAL,
      language: null,
      // New fields
      age: null,
      gender: null,
      personality: 'Empathetic',
      sentiment: Sentiment.NEUTRAL,
      interests: [],
    };
  }, [agent, agentData]);

  // Form validation - create schema that matches AgentFormValues types
  const validationSchema = useMemo(
    () =>
      ({
        name: [validationRules.required(t('config.errors.validation.agentNameRequired'))],
        description: [
          {
            validate: (value: string) => {
              if (!value) return true; // Optional
              return value.length <= 5000;
            },
            message: t('config.errors.validation.descriptionMaxLength'),
          },
        ],
        avatarUrl: [
          {
            validate: (value: string | null) => {
              if (!value || value.trim() === '') return true;
              try {
                new URL(value);
                return true;
              } catch {
                return false;
              }
            },
            message: t('config.errors.validation.avatarUrlInvalid'),
          },
        ],
        agentType: [validationRules.required(t('config.errors.validation.agentTypeRequired'))],
        personality: [validationRules.required(t('config.errors.validation.personalityRequired'))],
        sentiment: [validationRules.required(t('config.errors.validation.sentimentRequired'))],
        age: [
          {
            validate: (value) => {
              if (value === null) return true; // Age is optional (can be null)
              const numValue = Number(value);
              return !isNaN(numValue) && numValue >= 6 && numValue <= 100;
            },
            message: t('config.errors.validation.ageRange'),
          },
        ],
      }) as ValidationSchema<AgentFormValues>,
    [t]
  );

  const { values, errors, touched, setValue, setTouched, validateAll, reset } =
    useFormValidation<AgentFormValues>(validationSchema, initialValues);

  // Track previous agent/agentData to detect changes
  // Use a serialized version to detect deep changes
  const prevAgentRef = useRef<string>('');
  const prevAgentDataRef = useRef<string>('');

  // Update form when agent or agentData changes
  useEffect(() => {
    // Serialize current agent and agentData for comparison
    const currentAgentSerialized = agent
      ? JSON.stringify({
          id: agent.id,
          name: agent.name,
          avatarUrl: agent.avatarUrl,
          agentType: agent.agentType,
          language: agent.language,
        })
      : '';
    const currentAgentDataSerialized = agentData
      ? JSON.stringify({
          id: agentData.id,
          configs: agentData.configs,
        })
      : '';

    // Only update if agent or agentData actually changed
    const agentChanged = prevAgentRef.current !== currentAgentSerialized;
    const agentDataChanged =
      prevAgentDataRef.current !== currentAgentDataSerialized;

    if (!agentChanged && !agentDataChanged) {
      return;
    }

    // Update refs
    prevAgentRef.current = currentAgentSerialized;
    prevAgentDataRef.current = currentAgentDataSerialized;

    if (agent && agentData) {
      const config = agentData.configs || {};
      setValue('name', agent.name);
      setValue(
        'description',
        typeof config.system_prompt === 'string' ? config.system_prompt : ''
      );
      setValue('avatarUrl', agent.avatarUrl || null);
      setValue('agentType', agent.agentType || AgentType.GENERAL);
      setValue('language', agent.language || null);
      // New fields
      setValue('age', typeof config.age === 'number' ? config.age : null);
      setValue(
        'gender',
        config.gender && Object.values(Gender).includes(config.gender as Gender)
          ? (config.gender as Gender)
          : null
      );
      setValue(
        'personality',
        config.personality &&
          PERSONALITY_TYPES.includes(config.personality as PersonalityType)
          ? (config.personality as PersonalityType)
          : 'Empathetic'
      );
      setValue(
        'sentiment',
        config.sentiment &&
          Object.values(Sentiment).includes(config.sentiment as Sentiment)
          ? (config.sentiment as Sentiment)
          : Sentiment.NEUTRAL
      );
      setValue(
        'interests',
        Array.isArray(config.interests) ? config.interests : []
      );
    } else if (agent && agent.id < 0) {
      setValue('name', agent.name || '');
      setValue('description', '');
      setValue('avatarUrl', agent.avatarUrl || null);
      setValue('agentType', agent.agentType || AgentType.GENERAL);
      setValue('language', agent.language || null);
      // New fields
      setValue('age', null);
      setValue('gender', null);
      setValue('personality', 'Empathetic');
      setValue('sentiment', Sentiment.NEUTRAL);
      setValue('interests', []);
    } else {
      reset();
    }
    // Note: setValue and reset are intentionally excluded from deps to prevent infinite loops
    // They are stable enough for this use case (only called when agent/agentData actually changes)
    // We serialize agent and agentData in the effect to detect deep changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agent, agentData]);

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
