import { useEffect, useMemo, useRef } from 'react';
import { Agent } from '../../../../types/chat.types';
import {
  useFormValidation,
  agentFormValidationSchema,
  createValidationSchema,
} from '@openai/utils';
import { parseBehaviorRules } from '../../utils/agent.utils';
import {
  AgentType,
  ResponseLength,
  Gender,
  Sentiment,
  Availability,
} from '../../../../types/agent.types';
import { PersonalityType, PERSONALITY_TYPES } from '@openai/shared-types';

export interface AgentFormValues extends Record<string, unknown> {
  name: string;
  description: string; // This is now the system prompt (renamed)
  avatarUrl: string | null;
  agentType: AgentType;
  language: string | null;
  temperature: number;
  behaviorRules: string[];
  // New fields
  responseLength: ResponseLength | null;
  age: number | null;
  gender: Gender | null;
  personality: PersonalityType | null;
  sentiment: Sentiment | null;
  interests: string[];
  availability: Availability | null;
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
  // Initial form values
  const initialValues = useMemo<AgentFormValues>(() => {
    if (agent && agentData) {
      const config = agentData.configs || {};
      return {
        name: agent.name,
        description:
          typeof config.system_prompt === 'string' ? config.system_prompt : '',
        avatarUrl: agent.avatarUrl || null,
        agentType: agent.agentType || AgentType.GENERAL,
        language: agent.language || null,
        temperature:
          typeof config.temperature === 'number' ? config.temperature : 0.7,
        behaviorRules: parseBehaviorRules(config.behavior_rules),
        // New fields
        responseLength:
          config.response_length &&
          Object.values(ResponseLength).includes(
            config.response_length as ResponseLength
          )
            ? (config.response_length as ResponseLength)
            : null,
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
            : null,
        sentiment:
          config.sentiment &&
          Object.values(Sentiment).includes(config.sentiment as Sentiment)
            ? (config.sentiment as Sentiment)
            : null,
        interests: Array.isArray(config.interests) ? config.interests : [],
        availability:
          config.availability &&
          Object.values(Availability).includes(
            config.availability as Availability
          )
            ? (config.availability as Availability)
            : null,
      };
    } else if (agent && agent.id < 0) {
      // New agent
      return {
        name: agent.name || '',
        description: '',
        avatarUrl: agent.avatarUrl || null,
        agentType: agent.agentType || AgentType.GENERAL,
        language: agent.language || null,
        temperature: 0.7,
        behaviorRules: [],
        // New fields
        responseLength: null,
        age: null,
        gender: null,
        personality: null,
        sentiment: null,
        interests: [],
        availability: null,
      };
    }
    return {
      name: '',
      description: '',
      avatarUrl: null,
      agentType: AgentType.GENERAL,
      language: null,
      temperature: 0.7,
      behaviorRules: [],
      // New fields
      responseLength: null,
      age: null,
      gender: null,
      personality: null,
      sentiment: null,
      interests: [],
      availability: null,
    };
  }, [agent, agentData]);

  // Form validation - use centralized schema
  const validationSchema = createValidationSchema(agentFormValidationSchema, {
    name: agentFormValidationSchema.name,
  });

  const { values, errors, touched, setValue, setTouched, validateAll, reset } =
    useFormValidation<AgentFormValues>(validationSchema, initialValues);

  // Track previous agent/agentData IDs to prevent unnecessary updates
  const prevAgentIdRef = useRef<number | null>(agent?.id ?? null);
  const prevAgentDataIdRef = useRef<number | null>(agentData?.id ?? null);

  // Update form when agent or agentData changes
  useEffect(() => {
    const currentAgentId = agent?.id ?? null;
    const currentAgentDataId = agentData?.id ?? null;

    // Only update if agent or agentData ID actually changed
    if (
      prevAgentIdRef.current === currentAgentId &&
      prevAgentDataIdRef.current === currentAgentDataId
    ) {
      return;
    }

    prevAgentIdRef.current = currentAgentId;
    prevAgentDataIdRef.current = currentAgentDataId;

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
      setValue(
        'temperature',
        typeof config.temperature === 'number' ? config.temperature : 0.7
      );
      setValue('behaviorRules', parseBehaviorRules(config.behavior_rules));
      // New fields
      setValue(
        'responseLength',
        config.response_length &&
          Object.values(ResponseLength).includes(
            config.response_length as ResponseLength
          )
          ? (config.response_length as ResponseLength)
          : null
      );
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
          : null
      );
      setValue(
        'sentiment',
        config.sentiment &&
          Object.values(Sentiment).includes(config.sentiment as Sentiment)
          ? (config.sentiment as Sentiment)
          : null
      );
      setValue(
        'interests',
        Array.isArray(config.interests) ? config.interests : []
      );
      setValue(
        'availability',
        config.availability &&
          Object.values(Availability).includes(
            config.availability as Availability
          )
          ? (config.availability as Availability)
          : null
      );
    } else if (agent && agent.id < 0) {
      setValue('name', agent.name || '');
      setValue('description', '');
      setValue('avatarUrl', agent.avatarUrl || null);
      setValue('agentType', agent.agentType || AgentType.GENERAL);
      setValue('language', agent.language || null);
      setValue('temperature', 0.7);
      setValue('behaviorRules', []);
      // New fields
      setValue('responseLength', null);
      setValue('age', null);
      setValue('gender', null);
      setValue('personality', null);
      setValue('sentiment', null);
      setValue('interests', []);
      setValue('availability', null);
    } else {
      reset();
    }
    // Note: setValue and reset are intentionally excluded from deps to prevent infinite loops
    // They are stable enough for this use case (only called when agent/agentData IDs change)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agent?.id, agentData?.id]);

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
