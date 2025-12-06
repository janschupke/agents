import { Agent } from '../../../../types/chat.types';
import {
  useCreateAgent,
  useUpdateAgent,
  useDeleteAgent,
} from '../../../../hooks/mutations/use-agent-mutations';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../../../hooks/queries/query-keys';
import { useConfirm } from '../../../../hooks/ui/useConfirm';
import { AgentFormValues } from './use-agent-form';
import { useTranslation, I18nNamespace } from '@openai/i18n';

// Temporary agent ID for new agents (negative to indicate not saved)
let tempAgentIdCounter = -1;

interface UseAgentConfigOperationsOptions {
  contextAgents: Agent[];
  localAgents: Agent[];
  setLocalAgents: React.Dispatch<React.SetStateAction<Agent[]>>;
  currentAgentId: number | null;
  setCurrentAgentId: (agentId: number | null) => void;
}

interface UseAgentConfigOperationsReturn {
  handleSave: (agent: Agent, values: AgentFormValues) => Promise<Agent | null>;
  handleDelete: (agentId: number) => Promise<void>;
  handleNewAgent: () => void;
  saving: boolean;
}

/**
 * Manages agent CRUD operations (create, update, delete)
 */
export function useAgentConfigOperations({
  contextAgents,
  localAgents,
  setLocalAgents,
  currentAgentId,
  setCurrentAgentId,
}: UseAgentConfigOperationsOptions): UseAgentConfigOperationsReturn {
  const { confirm } = useConfirm();
  const queryClient = useQueryClient();
  const { t } = useTranslation(I18nNamespace.CLIENT);
  const createAgentMutation = useCreateAgent();
  const updateAgentMutation = useUpdateAgent();
  const deleteAgentMutation = useDeleteAgent();

  const handleSave = async (
    agent: Agent,
    values: AgentFormValues
  ): Promise<Agent | null> => {
    if (!agent) return null;

    const validRules = values.behaviorRules.filter(
      (rule) => rule.trim().length > 0
    );
    const configs = {
      system_prompt:
        (typeof values.description === 'string'
          ? values.description.trim()
          : '') || undefined,
      behavior_rules: validRules.length > 0 ? validRules : [],
    };

    try {
      if (agent.id < 0) {
        // Creating a new agent
        const result = await createAgentMutation.mutateAsync({
          name: values.name.trim(),
          description: values.description.trim() || undefined,
          avatarUrl: values.avatarUrl || undefined,
          configs,
        });
        // Remove from localAgents if it was there
        setLocalAgents((prev) => prev.filter((a) => a.id !== agent.id));
        // Update currentAgentId to the saved agent's real ID
        if (result.id > 0) {
          setCurrentAgentId(result.id);
        }
        return result;
      } else {
        // Updating an existing agent
        await updateAgentMutation.mutateAsync({
          agentId: agent.id,
          data: {
            name: values.name.trim(),
            description: values.description.trim() || undefined,
            avatarUrl: values.avatarUrl || undefined,
            configs,
          },
        });
        // Get updated agent from cache
        const updatedAgent = queryClient.getQueryData<Agent>(
          queryKeys.agents.detail(agent.id)
        );
        if (updatedAgent) {
          return updatedAgent;
        } else {
          return {
            ...agent,
            name: values.name.trim(),
            description: values.description.trim() || null,
            avatarUrl: values.avatarUrl || null,
          };
        }
      }
    } catch (error) {
      // Error is handled by mutation hook (toast notification)
      console.error('Failed to save agent:', error);
      return null;
    }
  };

  const handleDelete = async (agentId: number) => {
    const allAgents = [...contextAgents, ...localAgents];
    const agent = allAgents.find((a) => a.id === agentId);
    if (!agent) return;

    const confirmed = await confirm({
      title: 'Delete Agent',
      message: `Are you sure you want to delete "${agent.name}"? This will delete all related data: sessions, messages, configs, and memories.`,
      confirmText: t('buttons.delete'),
      cancelText: t('buttons.cancel'),
      confirmVariant: 'danger',
    });

    if (!confirmed) {
      return;
    }

    try {
      await deleteAgentMutation.mutateAsync(agentId);
      // Remove from localAgents if it was there
      setLocalAgents((prev) => prev.filter((a) => a.id !== agentId));
      // If deleted agent was selected, select first available agent or clear selection
      if (currentAgentId === agentId) {
        const remainingAgents = [...contextAgents, ...localAgents].filter(
          (a) => a.id !== agentId
        );
        if (remainingAgents.length > 0) {
          setCurrentAgentId(remainingAgents[0].id);
        } else {
          setCurrentAgentId(null);
        }
      }
    } catch (error) {
      // Error is handled by mutation hook (toast notification)
      console.error('Failed to delete agent:', error);
    }
  };

  const handleNewAgent = () => {
    const tempId = tempAgentIdCounter--;
    const newAgent: Agent = {
      id: tempId,
      name: '',
      description: null,
      avatarUrl: null,
      agentType: null,
      language: null,
      createdAt: new Date().toISOString(),
    };
    setLocalAgents((prev) => [newAgent, ...prev]);
    setCurrentAgentId(tempId);
  };

  const saving = createAgentMutation.isPending || updateAgentMutation.isPending;

  return {
    handleSave,
    handleDelete,
    handleNewAgent,
    saving,
  };
}
