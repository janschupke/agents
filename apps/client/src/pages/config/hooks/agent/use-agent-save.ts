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
            system_prompt: values.description,
            behavior_rules:
              values.behaviorRules.filter((r) => r.trim()).length > 0
                ? values.behaviorRules.filter((r) => r.trim())
                : [],
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
            system_prompt: values.description.trim() || undefined,
            behavior_rules:
              values.behaviorRules.filter((r) => r.trim()).length > 0
                ? values.behaviorRules.filter((r) => r.trim())
                : [],
            // Mandatory fields - always send (API will use defaults if not provided, but we always provide them)
            personality: values.personality,
            sentiment: values.sentiment,
            // Optional fields
            age: values.age ?? undefined,
            gender: values.gender || undefined,
            interests:
              values.interests.length > 0 ? values.interests : undefined,
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
              system_prompt: values.description.trim() || undefined,
              behavior_rules:
                values.behaviorRules.filter((r) => r.trim()).length > 0
                  ? values.behaviorRules.filter((r) => r.trim())
                  : [],
              // Mandatory fields - always send
              personality: values.personality,
              sentiment: values.sentiment,
              // Optional fields
              age: values.age ?? undefined,
              gender: values.gender || undefined,
              interests:
                values.interests.length > 0 ? values.interests : undefined,
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
