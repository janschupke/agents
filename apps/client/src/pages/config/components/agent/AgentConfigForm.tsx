import { Agent } from '../../../../types/chat.types';
import { useAgent } from '../../../../hooks/queries/use-agents';
import { useAgentMemories as useAgentMemoriesQuery } from '../../../../hooks/queries/use-agents';
import { useAgentForm } from '../../hooks/use-agent-form';
import { useAgentMemories } from '../../hooks/use-agent-memories';
import { useTranslation, I18nNamespace } from '@openai/i18n';
import { FormContainer } from '@openai/ui';
import {
  DescriptionField,
  TemperatureField,
  SystemPromptField,
  BehaviorRulesField,
} from './AgentConfigFormFields';
import AgentConfigFormSkeleton from './AgentConfigFormSkeleton';
import AgentNameAndAvatar from './AgentNameAndAvatar';
import MemoriesSection from './MemoriesSection';
import { forwardRef, useImperativeHandle, useEffect } from 'react';

interface AgentConfigFormProps {
  agent: Agent | null;
  saving?: boolean;
  onSaveClick: (
    agent: Agent,
    values: ReturnType<typeof useAgentForm>['values']
  ) => Promise<void>;
  onFormStateChange?: (canSave: boolean) => void;
}

export interface AgentConfigFormRef {
  save: () => Promise<void>;
  canSave: () => boolean;
}

const AgentConfigForm = forwardRef<AgentConfigFormRef, AgentConfigFormProps>(
  ({ agent, saving = false, onSaveClick, onFormStateChange }, ref) => {
    // React Query hooks
    const { data: agentData, isLoading: loadingAgent } = useAgent(
      agent?.id || null
    );
    const { data: memories = [], isLoading: loadingMemories } =
      useAgentMemoriesQuery(agent?.id || null);

    // Form management hook
    const { values, errors, touched, setValue, setTouched, validateAll } =
      useAgentForm({ agent, agentData: agentData || null });

    // Memory operations hook
    const {
      editingId,
      deletingId,
      handleDeleteMemory,
      handleEditMemory,
      handleRefreshMemories,
    } = useAgentMemories({ agentId: agent?.id || null });

    const loadingConfig = loadingAgent && agent !== null && agent.id > 0;

    const handleSave = async () => {
      if (!agent) return;

      // Validate form
      const validation = validateAll();
      if (!validation.isValid) {
        return;
      }

      await onSaveClick(agent, values);
    };

    useImperativeHandle(ref, () => ({
      save: handleSave,
      canSave: () => !!agent && !!values.name.trim(),
    }));

    // Notify parent when form state changes
    useEffect(() => {
      if (onFormStateChange) {
        onFormStateChange(!!agent && !!values.name.trim());
      }
    }, [agent, values.name, onFormStateChange]);

    const { t } = useTranslation(I18nNamespace.CLIENT);

    if (!agent) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-text-tertiary text-center text-sm">
            {t('config.selectAgent')}
          </div>
        </div>
      );
    }

    return (
      <FormContainer saving={saving}>
        {loadingConfig ? (
          <AgentConfigFormSkeleton />
        ) : (
          <div className="space-y-5">
            <AgentNameAndAvatar
              avatarUrl={values.avatarUrl}
              name={values.name}
              nameError={errors.name ?? undefined}
              nameTouched={touched.name}
              saving={saving}
              autoFocus={agent.id < 0}
              onAvatarChange={(url) => setValue('avatarUrl', url)}
              onNameChange={(value) => setValue('name', value)}
              onNameBlur={() => setTouched('name')}
            />
            <DescriptionField
              value={values.description}
              onChange={(val) => setValue('description', val)}
            />
            <TemperatureField
              value={values.temperature}
              onChange={(val) => setValue('temperature', val)}
            />
            <SystemPromptField
              value={values.systemPrompt}
              onChange={(val) => setValue('systemPrompt', val)}
            />
            <BehaviorRulesField
              rules={values.behaviorRules}
              onChange={(rules) => setValue('behaviorRules', rules)}
            />

            <MemoriesSection
              agentId={agent.id}
              memories={memories}
              loading={loadingMemories}
              editingId={editingId}
              deletingId={deletingId}
              onEdit={handleEditMemory}
              onDelete={handleDeleteMemory}
              onRefresh={handleRefreshMemories}
            />
          </div>
        )}
      </FormContainer>
    );
  }
);

AgentConfigForm.displayName = 'AgentConfigForm';

export default AgentConfigForm;
