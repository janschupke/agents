import { useParams, useNavigate } from 'react-router-dom';
import { useRef, useState } from 'react';
import AgentSidebar from '../AgentSidebar/AgentSidebar';
import AgentConfigForm, { AgentConfigFormRef } from './parts/AgentConfigForm';
import AgentConfigErrorState from './parts/AgentConfigErrorState';
import AgentConfigLoadingState from './parts/AgentConfigLoadingState';
import AgentConfigFormSkeleton from './parts/AgentConfigFormSkeleton';
import {
  Sidebar,
  Container,
  PageHeader,
  PageContent,
  FormButton,
  ButtonType,
  ButtonVariant,
} from '@openai/ui';
import { useAgents } from '../../../../../hooks/queries/use-agents';
import { useSidebarLoadingState } from '../../../../../hooks/utils/use-sidebar-loading-state';
import { useAgentConfigData } from '../../../hooks/agent/use-agent-config-data';
import { useAgentConfigNavigation } from '../../../hooks/agent/use-agent-config-navigation';
import { useTranslation, I18nNamespace } from '@openai/i18n';
import { useIsNewAgent } from '../../../hooks/agent/use-is-new-agent';
import { useNewAgentForm } from '../../../hooks/form/use-new-agent-form';
import { useUnsavedChangesWarning } from '../../../../../hooks/ui/use-unsaved-changes-warning';
import { useAgentSave } from '../../../hooks/agent/use-agent-save';
import { useAgentDelete } from '../../../hooks/agent/use-agent-delete';
import { useAgentConfigState } from '../../../hooks/agent/use-agent-config-state';

interface AgentConfigProps {
  agentId?: number;
  error?: string;
  isNewAgent?: boolean;
}

export default function AgentConfig({
  agentId: propAgentId,
  error: propError,
  isNewAgent: propIsNewAgent,
}: AgentConfigProps) {
  const { t } = useTranslation(I18nNamespace.CLIENT);
  const navigate = useNavigate();
  const { agentId: urlAgentId } = useParams<{ agentId?: string }>();

  // Determine if this is a new agent
  const isNewAgent = useIsNewAgent(propIsNewAgent);

  // For new agents, use form state management
  const { hasUnsavedChanges } = useNewAgentForm();
  useUnsavedChangesWarning(isNewAgent ? hasUnsavedChanges : false);

  // Business logic moved to hooks (only for existing agents)
  const { agentId, agent, loading, error } = useAgentConfigData({
    propAgentId: isNewAgent ? undefined : propAgentId,
    urlAgentId: isNewAgent ? undefined : urlAgentId,
  });

  const { handleAgentSelect, handleNewAgent } = useAgentConfigNavigation({
    navigate,
  });

  const { data: agents = [], isLoading: loadingAgents } = useAgents();
  const { shouldShowLoading: shouldShowSidebarLoading } =
    useSidebarLoadingState({
      type: 'agents',
      isLoading: loadingAgents,
    });
  const formRef = useRef<AgentConfigFormRef>(null);
  const [canSave, setCanSave] = useState(false);

  // Agent save logic
  const { handleSave, isSaving } = useAgentSave({
    isNewAgent,
    navigate,
  });

  // Agent delete logic
  const { handleDelete, ConfirmDialog } = useAgentDelete({
    agents,
  });

  // Agent config state (currentAgent and isSaving)
  const { currentAgent } = useAgentConfigState({
    isNewAgent,
    agent,
  });

  const handleSaveClick = async () => {
    if (formRef.current) {
      await formRef.current.save();
    }
  };

  // Handle form value changes
  const handleFormStateChange = (canSaveValue: boolean) => {
    setCanSave(canSaveValue);
  };

  // Loading state - only show full page loading if we don't have cached agents
  // This ensures sidebar stays visible when agents are cached
  // If agents are cached, always render the component (even if loading specific agent)
  const { shouldShowLoading: shouldShowFullPageLoading } =
    useSidebarLoadingState({
      type: 'agents',
      isLoading: loadingAgents,
    });

  // Only show full page loading if:
  // 1. We don't have cached agents AND agents are loading
  // 2. OR we're loading a specific agent AND we don't have cached agents
  // If agents are cached, always show the component (sidebar will be visible)
  if (shouldShowFullPageLoading && !isNewAgent) {
    return <AgentConfigLoadingState />;
  }

  return (
    <>
      <Sidebar>
        <AgentSidebar
          agents={agents}
          currentAgentId={isNewAgent ? null : agentId}
          onAgentSelect={handleAgentSelect}
          onNewAgent={handleNewAgent}
          onAgentDelete={handleDelete}
          loading={shouldShowSidebarLoading}
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
              {loading && !isNewAgent && !currentAgent ? (
                <AgentConfigFormSkeleton />
              ) : (
                <AgentConfigForm
                  ref={formRef}
                  agent={currentAgent}
                  saving={isSaving}
                  onSaveClick={handleSave}
                  onFormStateChange={handleFormStateChange}
                />
              )}
            </PageContent>
          </>
        )}
      </Container>
      {ConfirmDialog}
    </>
  );
}
