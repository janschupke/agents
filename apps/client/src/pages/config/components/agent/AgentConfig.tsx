import { useParams, useNavigate } from 'react-router-dom';
import { Agent } from '../../../../types/chat.types';
import AgentSidebar from './AgentSidebar';
import AgentConfigForm from './AgentConfigForm';
import AgentConfigErrorState from './AgentConfigErrorState';
import { PageContainer, PageHeader, Skeleton } from '@openai/ui';
import { useAgents } from '../../../../hooks/queries/use-agents';
import { useAgentConfigData } from '../../hooks/use-agent-config-data';
import { useAgentConfigNavigation } from '../../hooks/use-agent-config-navigation';
import { useUpdateAgent } from '../../../../hooks/mutations/use-agent-mutations';
import { useConfirm } from '../../../../hooks/useConfirm';
import { useTranslation, I18nNamespace } from '@openai/i18n';
import { AgentFormValues } from '../../hooks/use-agent-form';

interface AgentConfigProps {
  agentId?: number;
  loading?: boolean;
  error?: string;
}

function AgentConfigLoadingState() {
  return (
    <PageContainer>
      <div className="flex h-full">
        <div className="w-56 border-r border-border p-3">
          <Skeleton className="h-6 w-20 mb-3" />
        </div>
        <div className="flex-1 flex flex-col overflow-hidden">
          <PageHeader title="Agent Configuration" />
          <div className="flex-1 overflow-y-auto p-5">
            <Skeleton className="h-8 w-48 mb-4" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4 mb-4" />
          </div>
        </div>
      </div>
    </PageContainer>
  );
}

export default function AgentConfig({
  agentId: propAgentId,
  loading: propLoading,
  error: propError,
}: AgentConfigProps) {
  const { t } = useTranslation(I18nNamespace.CLIENT);
  const navigate = useNavigate();
  const { agentId: urlAgentId } = useParams<{ agentId?: string }>();
  const { ConfirmDialog, confirm } = useConfirm();

  // Business logic moved to hooks
  const { agentId, agent, loading, error } = useAgentConfigData({
    propAgentId,
    urlAgentId,
  });

  const {
    handleAgentSelect,
    handleNewAgent,
    handleSave: handleSaveNavigation,
  } = useAgentConfigNavigation({
    navigate,
  });

  const { data: agents = [], isLoading: loadingAgents } = useAgents();
  const updateAgentMutation = useUpdateAgent();

  const handleSave = async (agent: Agent, values: AgentFormValues) => {
    if (!agent || agent.id < 0) return;

    try {
      await updateAgentMutation.mutateAsync({
        agentId: agent.id,
        data: {
          name: values.name.trim(),
          description: values.description.trim() || undefined,
          avatarUrl: values.avatarUrl || undefined,
          configs: {
            temperature: values.temperature,
            system_prompt: values.systemPrompt.trim() || undefined,
            behavior_rules:
              values.behaviorRules.filter((r) => r.trim()).length > 0
                ? values.behaviorRules.filter((r) => r.trim())
                : undefined,
          },
        },
      });
      await handleSaveNavigation(agent, agent.id);
    } catch (error) {
      // Error is handled by mutation hook (toast notification)
      console.error('Failed to save agent:', error);
      throw error;
    }
  };

  const handleDelete = async (agentId: number) => {
    const agentToDelete = agents.find((a) => a.id === agentId);
    if (!agentToDelete) return;

    const confirmed = await confirm({
      title: 'Delete Agent',
      message: `Are you sure you want to delete "${agentToDelete.name}"? This will delete all related data: sessions, messages, configs, and memories.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      confirmVariant: 'danger',
    });

    if (!confirmed) return;

    // TODO: Implement delete mutation
    // await deleteAgentMutation.mutateAsync(agentId);
  };

  // Loading state
  if (propLoading || loading || loadingAgents) {
    return <AgentConfigLoadingState />;
  }

  const currentAgent = agent || null;

  return (
    <PageContainer>
      <div className="flex h-full">
        <AgentSidebar
          agents={agents}
          currentAgentId={agentId}
          onAgentSelect={handleAgentSelect}
          onNewAgent={handleNewAgent}
          onAgentDelete={handleDelete}
          loading={loadingAgents}
        />
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Error state - show in page content */}
          {propError || error ? (
            <AgentConfigErrorState
              message={propError || error || t('config.errors.agentNotFound')}
            />
          ) : (
            <AgentConfigForm
              agent={currentAgent}
              saving={updateAgentMutation.isPending}
              onSaveClick={handleSave}
            />
          )}
        </div>
      </div>
      {ConfirmDialog}
    </PageContainer>
  );
}
