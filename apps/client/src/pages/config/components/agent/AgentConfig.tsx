import { useParams, useNavigate, useLocation } from 'react-router-dom';
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
import {
  useUpdateAgent,
  useCreateAgent,
} from '../../../../hooks/mutations/use-agent-mutations';
import { useConfirm } from '../../../../hooks/useConfirm';
import { useTranslation, I18nNamespace } from '@openai/i18n';
import { AgentFormValues } from '../../hooks/use-agent-form';
import { ROUTES } from '../../../../constants/routes.constants';
import { useNewAgentForm } from '../../hooks/use-new-agent-form';
import { useUnsavedChangesWarning } from '../../../../hooks/use-unsaved-changes-warning';

interface AgentConfigProps {
  agentId?: number;
  loading?: boolean;
  error?: string;
  isNewAgent?: boolean;
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
  isNewAgent: propIsNewAgent,
}: AgentConfigProps) {
  const { t } = useTranslation(I18nNamespace.CLIENT);
  const navigate = useNavigate();
  const location = useLocation();
  const { agentId: urlAgentId } = useParams<{ agentId?: string }>();
  const { ConfirmDialog, confirm } = useConfirm();

  // Determine if this is a new agent
  const isNewAgent =
    propIsNewAgent ||
    location.pathname === ROUTES.CONFIG_NEW ||
    urlAgentId === 'new';

  // For new agents, use form state management
  const { formData, setFormData, hasUnsavedChanges } = useNewAgentForm();
  useUnsavedChangesWarning(isNewAgent ? hasUnsavedChanges : false);

  // Business logic moved to hooks (only for existing agents)
  const { agentId, agent, loading, error } = useAgentConfigData({
    propAgentId: isNewAgent ? undefined : propAgentId,
    urlAgentId: isNewAgent ? undefined : urlAgentId,
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
  const createAgentMutation = useCreateAgent();
  const formRef = useRef<AgentConfigFormRef>(null);
  const [canSave, setCanSave] = useState(false);

  // Create temp agent for new agent form
  const tempAgent: Agent | null = isNewAgent
    ? {
        id: -1,
        name: formData.name || '',
        description: formData.description || null,
        avatarUrl: formData.avatarUrl || null,
        createdAt: new Date().toISOString(),
        configs: formData.configs || {
          temperature: 1,
          system_prompt: '',
          behavior_rules: [],
        },
      }
    : null;

  const handleSaveClick = async () => {
    if (formRef.current) {
      await formRef.current.save();
    }
  };

  const handleSave = async (agent: Agent, values: AgentFormValues) => {
    if (!agent) return;

    try {
      if (isNewAgent || agent.id < 0) {
        // Update formData for new agents (for unsaved changes tracking)
        setFormData({
          name: values.name,
          description: values.description || null,
          avatarUrl: values.avatarUrl || null,
          configs: {
            temperature: values.temperature,
            system_prompt: values.systemPrompt,
            behavior_rules: values.behaviorRules,
          },
        });

        // Create new agent
        const agentData = {
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
      }
    } catch (error) {
      // Error is handled by mutation hook (toast notification)
      console.error('Failed to save agent:', error);
      throw error;
    }
  };

  // Handle form value changes
  const handleFormStateChange = (canSaveValue: boolean) => {
    setCanSave(canSaveValue);
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
  if ((propLoading || loading || loadingAgents) && !isNewAgent) {
    return <AgentConfigLoadingState />;
  }

  const currentAgent = isNewAgent ? tempAgent : agent || null;
  const isSaving =
    isNewAgent || currentAgent?.id === -1
      ? createAgentMutation.isPending
      : updateAgentMutation.isPending;

  return (
    <>
      <Sidebar>
        <AgentSidebar
          agents={agents}
          currentAgentId={isNewAgent ? null : agentId}
          onAgentSelect={handleAgentSelect}
          onNewAgent={handleNewAgent}
          onAgentDelete={handleDelete}
          loading={loadingAgents}
          isNewAgentRoute={isNewAgent}
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
                    loading={isSaving}
                    disabled={!canSave}
                    variant={ButtonVariant.PRIMARY}
                    tooltip={
                      isSaving
                        ? t('config.saving')
                        : isNewAgent || currentAgent.id < 0
                          ? t('config.createAgent')
                          : t('config.saveButton')
                    }
                  >
                    {isNewAgent || currentAgent.id < 0
                      ? t('config.createAgent')
                      : t('config.saveButton')}
                  </FormButton>
                ) : undefined
              }
            />
            <PageContent
              animateOnChange={isNewAgent ? 'new' : agentId}
              enableAnimation={true}
            >
              <AgentConfigForm
                ref={formRef}
                agent={currentAgent}
                saving={isSaving}
                onSaveClick={handleSave}
                onFormStateChange={handleFormStateChange}
              />
            </PageContent>
          </>
        )}
      </Container>
      {ConfirmDialog}
    </>
  );
}
