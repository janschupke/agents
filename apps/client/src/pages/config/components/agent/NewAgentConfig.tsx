import { useNavigate } from 'react-router-dom';
import { useConfirm } from '../../../../hooks/useConfirm';
import { useNewAgentForm } from '../../hooks/use-new-agent-form';
import { useNewAgentNavigation } from '../../hooks/use-new-agent-navigation';
import { useUnsavedChangesWarning } from '../../../../hooks/use-unsaved-changes-warning';
import { PageContainer } from '@openai/ui';
import AgentConfigForm from './AgentConfigForm';
import AgentSidebar from './AgentSidebar';
import { Agent } from '../../../../types/chat.types';
import { useAgentForm } from '../../hooks/use-agent-form';
import { useAgents } from '../../../../hooks/queries/use-agents';
import { useAgentConfigNavigation } from '../../hooks/use-agent-config-navigation';

export default function NewAgentConfig() {
  const navigate = useNavigate();
  const { confirm, ConfirmDialog } = useConfirm();

  // Business logic moved to hooks
  const { formData, setFormData, hasUnsavedChanges } = useNewAgentForm();
  const { handleSave } = useNewAgentNavigation({
    formData,
    navigate,
    confirm,
  });

  const { data: agents = [], isLoading: loadingAgents } = useAgents();
  const { handleAgentSelect, handleNewAgent } = useAgentConfigNavigation({
    navigate,
  });

  // Centralized unsaved changes warning
  useUnsavedChangesWarning(hasUnsavedChanges);

  // Create a temporary agent object for the form
  const tempAgent: Agent = {
    id: -1, // Temporary ID for form compatibility
    name: formData.name || '',
    description: formData.description || null,
    avatarUrl: formData.avatarUrl || null,
    createdAt: new Date().toISOString(),
    configs: formData.configs,
  };

  // Use agent form hook for form management
  const { values } = useAgentForm({ agent: tempAgent, agentData: null });

  const handleSaveClick = async (_agent: Agent, formValues: typeof values) => {
    // Update formData with values
    setFormData({
      name: formValues.name,
      description: formValues.description || null,
      avatarUrl: formValues.avatarUrl || null,
      configs: {
        temperature: formValues.temperature,
        system_prompt: formValues.systemPrompt,
        behavior_rules: formValues.behaviorRules,
      },
    });
    // Then save
    await handleSave();
  };

  return (
    <PageContainer>
      <div className="flex h-full">
        <AgentSidebar
          agents={agents}
          currentAgentId={null}
          onAgentSelect={handleAgentSelect}
          onNewAgent={handleNewAgent}
          loading={loadingAgents}
          isNewAgentRoute={true}
        />
        <div className="flex-1 flex flex-col overflow-hidden">
          <AgentConfigForm
            agent={tempAgent}
            saving={false}
            onSaveClick={handleSaveClick}
          />
        </div>
      </div>
      {ConfirmDialog}
    </PageContainer>
  );
}
