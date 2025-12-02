import { useState } from 'react';
import { Agent } from '../../../types/chat.types';

/**
 * Hook to manage new agent form state
 * No negative IDs - uses null/undefined state
 */
export function useNewAgentForm() {
  const [formData, setFormData] = useState<Partial<Agent>>({
    name: '',
    description: null,
    avatarUrl: null,
    configs: {
      temperature: 1,
      system_prompt: '',
      behavior_rules: [],
    },
  });

  const hasUnsavedChanges = Boolean(
    formData.name?.trim() ||
      formData.description?.trim() ||
      formData.avatarUrl ||
      formData.configs?.system_prompt?.trim() ||
      (Array.isArray(formData.configs?.behavior_rules) &&
        formData.configs.behavior_rules.length > 0)
  );

  return {
    formData,
    setFormData,
    hasUnsavedChanges,
  };
}
