import { useEffect, useMemo, useRef } from 'react';
import { Agent } from '../../../types/chat.types';
import { useFormValidation } from '../../../hooks/use-form-validation';
import { validationRules } from '../../../utils/validation';
import { parseBehaviorRules } from '../utils/agent.utils';

export interface AgentFormValues extends Record<string, unknown> {
  name: string;
  description: string;
  avatarUrl: string | null;
  temperature: number;
  systemPrompt: string;
  behaviorRules: string[];
}

interface UseAgentFormOptions {
  agent: Agent | null;
  agentData: Agent | null;
}

interface UseAgentFormReturn {
  values: AgentFormValues;
  errors: Partial<Record<keyof AgentFormValues, string | null>>;
  touched: Partial<Record<keyof AgentFormValues, boolean>>;
  setValue: <K extends keyof AgentFormValues>(field: K, value: AgentFormValues[K]) => void;
  setTouched: (field: keyof AgentFormValues) => void;
  validateAll: () => { isValid: boolean; errors: Partial<Record<keyof AgentFormValues, string>> };
  reset: () => void;
}

/**
 * Manages form state and validation for agent configuration
 */
export function useAgentForm({ agent, agentData }: UseAgentFormOptions): UseAgentFormReturn {
  // Initial form values
  const initialValues = useMemo<AgentFormValues>(() => {
    if (agent && agentData) {
      const config = agentData.configs || {};
      return {
        name: agent.name,
        description: agent.description || '',
        avatarUrl: agent.avatarUrl || null,
        temperature: typeof config.temperature === 'number' ? config.temperature : 0.7,
        systemPrompt: typeof config.system_prompt === 'string' ? config.system_prompt : '',
        behaviorRules: parseBehaviorRules(config.behavior_rules),
      };
    } else if (agent && agent.id < 0) {
      // New agent
      return {
        name: agent.name || '',
        description: agent.description || '',
        avatarUrl: agent.avatarUrl || null,
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
  }, [agent, agentData]);

  // Form validation
  const validationSchema = {
    name: [validationRules.required('Agent name is required')],
  };

  const {
    values,
    errors,
    touched,
    setValue,
    setTouched,
    validateAll,
    reset,
  } = useFormValidation<AgentFormValues>(validationSchema, initialValues);

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
      setValue('description', agent.description || '');
      setValue('avatarUrl', agent.avatarUrl || null);
      setValue('temperature', typeof config.temperature === 'number' ? config.temperature : 0.7);
      setValue('systemPrompt', typeof config.system_prompt === 'string' ? config.system_prompt : '');
      setValue('behaviorRules', parseBehaviorRules(config.behavior_rules));
    } else if (agent && agent.id < 0) {
      setValue('name', agent.name || '');
      setValue('description', agent.description || '');
      setValue('avatarUrl', agent.avatarUrl || null);
      setValue('temperature', 0.7);
      setValue('systemPrompt', '');
      setValue('behaviorRules', []);
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
