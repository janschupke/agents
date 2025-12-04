import { Agent } from '../../../../types/chat.types';
import { AgentFormValues } from './use-agent-form';
import {
  useUpdateAgent,
  useCreateAgent,
} from '../../../../hooks/mutations/use-agent-mutations';
import { useNewAgentForm } from '../form/use-new-agent-form';
import { useAgentConfigNavigation } from './use-agent-config-navigation';
import { NavigateFunction } from 'react-router-dom';

interface UseAgentSaveOptions {
  isNewAgent: boolean;
  navigate: NavigateFunction;
}

interface UseAgentSaveReturn {
  handleSave: (agent: Agent, values: AgentFormValues) => Promise<void>;
  isSaving: boolean;
}

/**
 * Hook to handle agent save logic (create and update)
 */
export function useAgentSave({
  isNewAgent,
  navigate,
}: UseAgentSaveOptions): UseAgentSaveReturn {
  const { setFormData } = useNewAgentForm();
  const updateAgentMutation = useUpdateAgent();
  const createAgentMutation = useCreateAgent();
  const { handleSave: handleSaveNavigation } = useAgentConfigNavigation({
    navigate,
  });

  const handleSave = async (agent: Agent, values: AgentFormValues) => {
    if (!agent) return;

    try {
      if (isNewAgent || agent.id < 0) {
        // Update formData for new agents (for unsaved changes tracking)
        setFormData({
          name: values.name,
          description: values.description || null,
          avatarUrl: values.avatarUrl || null,
          agentType: values.agentType,
          language: values.language || null,
          configs: {
            temperature: values.temperature,
            system_prompt: values.description,
            behavior_rules: values.behaviorRules,
          },
        });

        // Create new agent
        const agentData = {
          name: values.name.trim(),
          description: values.description.trim() || undefined,
          avatarUrl: values.avatarUrl || undefined,
          agentType: values.agentType,
          language: values.language || undefined,
          configs: {
            temperature: values.temperature,
            system_prompt: values.description.trim() || undefined,
            behavior_rules:
              values.behaviorRules.filter((r) => r.trim()).length > 0
                ? values.behaviorRules.filter((r) => r.trim())
                : undefined,
            // New fields
            response_length: values.responseLength || undefined,
            age: values.age ?? undefined,
            gender: values.gender || undefined,
            personality: values.personality || undefined,
            sentiment: values.sentiment || undefined,
            interests:
              values.interests.length > 0 ? values.interests : undefined,
            availability: values.availability || undefined,
          },
        };
        const savedAgent = await createAgentMutation.mutateAsync(agentData);
        await handleSaveNavigation(savedAgent, savedAgent.id);
      } else {
        // Update existing agent
        await updateAgentMutation.mutateAsync({
          agentId: agent.id,
          data: {
            name: values.name.trim(),
            description: values.description.trim() || undefined,
            avatarUrl: values.avatarUrl || undefined,
            agentType: values.agentType,
            language: values.language || undefined,
            configs: {
              temperature: values.temperature,
              system_prompt: values.description.trim() || undefined,
              behavior_rules:
                values.behaviorRules.filter((r) => r.trim()).length > 0
                  ? values.behaviorRules.filter((r) => r.trim())
                  : undefined,
              // New fields
              response_length: values.responseLength || undefined,
              age: values.age ?? undefined,
              gender: values.gender || undefined,
              personality: values.personality || undefined,
              sentiment: values.sentiment || undefined,
              interests:
                values.interests.length > 0 ? values.interests : undefined,
              availability: values.availability || undefined,
            },
          },
        });
        await handleSaveNavigation(agent, agent.id);
      }
    } catch (error) {
      // Error is handled by mutation hook (toast notification)
      console.error('Failed to save agent:', error);
      throw error;
    }
  };

  const isSaving = isNewAgent
    ? createAgentMutation.isPending
    : updateAgentMutation.isPending;

  return {
    handleSave,
    isSaving,
  };
}
