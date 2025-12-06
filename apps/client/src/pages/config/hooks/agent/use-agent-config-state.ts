import { Agent } from '../../../../types/chat.types';
import { useNewAgentForm } from '../form/use-new-agent-form';

interface UseAgentConfigStateOptions {
  isNewAgent: boolean;
  agent: Agent | null | undefined;
}

interface UseAgentConfigStateReturn {
  currentAgent: Agent | null;
}

/**
 * Hook to manage agent config state (currentAgent)
 */
export function useAgentConfigState({
  isNewAgent,
  agent,
}: UseAgentConfigStateOptions): UseAgentConfigStateReturn {
  const { formData } = useNewAgentForm();

  // Create temp agent for new agent form
  const tempAgent: Agent | null = isNewAgent
    ? {
        id: -1,
        name: formData.name || '',
        description: formData.description || null,
        avatarUrl: formData.avatarUrl || null,
        agentType: formData.agentType || null,
        language: formData.language || null,
        createdAt: new Date().toISOString(),
        configs: formData.configs || {
          temperature: 1,
        },
      }
    : null;

  const currentAgent = isNewAgent ? tempAgent : agent || null;

  return {
    currentAgent,
  };
}
