import { useState } from 'react';
import { Agent } from '../../../../types/chat.types';

/**
 * Hook to manage new agent form state
 * No negative IDs - uses null/undefined state
 */
export function useNewAgentForm() {
  const [formData, setFormData] = useState<Partial<Agent>>({
    name: '',
    description: null,
    avatarUrl: null,
    agentType: null,
    language: null,
    configs: {
      temperature: 1,
    },
  });

  const hasUnsavedChanges = Boolean(
    formData.name?.trim() ||
      formData.description?.trim() ||
      formData.avatarUrl
  );

  return {
    formData,
    setFormData,
    hasUnsavedChanges,
  };
}
