import { useParams, useNavigate } from 'react-router-dom';
import { useRef, useState } from 'react';
import { Agent } from '../../../../types/chat.types';
import AgentSidebar from './AgentSidebar';
import AgentConfigForm, { AgentConfigFormRef } from './AgentConfigForm';
import AgentConfigErrorState from './AgentConfigErrorState';
import {
  Sidebar,
  Container,
  PageHeader,
  PageContent,
  Skeleton,
  FormButton,
  ButtonType,
  ButtonVariant,
} from '@openai/ui';
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
  const { t } = useTranslation(I18nNamespace.CLIENT);

  return (
    <>
      <Sidebar>
        <div className="p-3">
          <Skeleton className="h-6 w-20 mb-3" />
        </div>
      </Sidebar>
      <Container>
        <PageHeader title={t('config.title')} />
        <PageContent>
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4 mb-4" />
        </PageContent>
      </Container>
    </>
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
  const formRef = useRef<AgentConfigFormRef>(null);
  const [canSave, setCanSave] = useState(false);

  const handleSaveClick = async () => {
    if (formRef.current) {
      await formRef.current.save();
    }
  };

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
    <>
      <Sidebar>
        <AgentSidebar
          agents={agents}
          currentAgentId={agentId}
          onAgentSelect={handleAgentSelect}
          onNewAgent={handleNewAgent}
          onAgentDelete={handleDelete}
          loading={loadingAgents}
        />
      </Sidebar>
      <Container>
        {/* Error state - show in page content */}
        {propError || error ? (
          <AgentConfigErrorState
            message={propError || error || t('config.errors.agentNotFound')}
          />
        ) : (
          <>
            <PageHeader
              title={t('config.title')}
              actions={
                currentAgent ? (
                  <FormButton
                    type={ButtonType.BUTTON}
                    onClick={handleSaveClick}
                    loading={updateAgentMutation.isPending}
                    disabled={!canSave}
                    variant={ButtonVariant.PRIMARY}
                    tooltip={
                      updateAgentMutation.isPending
                        ? t('config.saving')
                        : currentAgent.id < 0
                          ? t('config.createAgent')
                          : t('config.saveButton')
                    }
                  >
                    {currentAgent.id < 0
                      ? t('config.createAgent')
                      : t('config.saveButton')}
                  </FormButton>
                ) : undefined
              }
            />
            <PageContent animateOnChange={agentId} enableAnimation={true}>
              <AgentConfigForm
                ref={formRef}
                agent={currentAgent}
                saving={updateAgentMutation.isPending}
                onSaveClick={handleSave}
                onFormStateChange={setCanSave}
              />
            </PageContent>
          </>
        )}
      </Container>
      {ConfirmDialog}
    </>
  );
}
