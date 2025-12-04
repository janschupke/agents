import { Agent } from '../../../../../../types/chat.types';
import { useAgent } from '../../../../../../hooks/queries/use-agents';
import { useAgentMemories as useAgentMemoriesQuery } from '../../../../../../hooks/queries/use-agents';
import { useAgentForm } from '../../../../hooks/agent/use-agent-form';
import { useAgentMemories as useAgentMemoryOperations } from '../../../../hooks/agent/use-agent-memories';
import { useTranslation, I18nNamespace } from '@openai/i18n';
import { FormContainer } from '@openai/ui';
import {
  TemperatureField,
  BehaviorRulesField,
} from './AgentConfigFormFields';
import AgentConfigFormSkeleton from './AgentConfigFormSkeleton';
import AgentNameAndAvatar from './AgentNameAndAvatar';
import MemoriesSection from './MemoriesSection';
import AgentTypeField from './AgentTypeField';
import LanguageField from './LanguageField';
import ResponseLengthField from './ResponseLengthField';
import AgeField from './AgeField';
import GenderField from './GenderField';
import PersonalityField from './PersonalityField';
import SentimentField from './SentimentField';
import AvailabilityField from './AvailabilityField';
import InterestsDashboard from './InterestsDashboard';
import { forwardRef, useImperativeHandle, useEffect, useRef } from 'react';

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
  updateName: (name: string) => void;
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
    } = useAgentMemoryOperations({ agentId: agent?.id || null });

    const loadingConfig = loadingAgent && agent !== null && agent.id > 0;
    const formRef = useRef<HTMLFormElement>(null);

    const handleSave = async () => {
      if (!agent) return;

      // Validate form
      const validation = validateAll();
      if (!validation.isValid) {
        return;
      }

      await onSaveClick(agent, values);
    };

    // Handle Enter key to submit form
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        // Only handle Enter if form is focused and not in a textarea
        if (
          e.key === 'Enter' &&
          !e.shiftKey &&
          !e.ctrlKey &&
          !e.metaKey &&
          formRef.current &&
          formRef.current.contains(document.activeElement) &&
          document.activeElement?.tagName !== 'TEXTAREA'
        ) {
          const canSave = !!agent && !!values.name.trim();
          if (canSave) {
            e.preventDefault();
            // Call handleSave directly - it's stable within the component
            void handleSave();
          }
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [agent, values.name]);

    useImperativeHandle(ref, () => ({
      save: handleSave,
      canSave: () => !!agent && !!values.name.trim(),
      updateName: (name: string) => {
        setValue('name', name);
        setTouched('name');
      },
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
          <form
            ref={formRef}
            onSubmit={(e) => {
              e.preventDefault();
              handleSave();
            }}
            className="space-y-5"
          >
            <AgentNameAndAvatar
              avatarUrl={values.avatarUrl}
              description={values.description}
              descriptionError={errors.description ?? undefined}
              saving={saving}
              onAvatarChange={(url) => setValue('avatarUrl', url)}
              onDescriptionChange={(val) => setValue('description', val)}
            />

            {/* 2-column layout for language, agent type, temperature */}
            <div className="grid grid-cols-2 gap-5">
              <AgentTypeField
                value={values.agentType}
                onChange={(val) => setValue('agentType', val)}
              />
              <LanguageField
                value={values.language}
                agentType={values.agentType}
                onChange={(val) => setValue('language', val)}
              />
              <TemperatureField
                value={values.temperature}
                onChange={(val) => setValue('temperature', val)}
              />
            </div>

            {/* 2-column layout for new simple fields */}
            <div className="grid grid-cols-2 gap-5">
              <ResponseLengthField
                value={values.responseLength}
                onChange={(val) => setValue('responseLength', val)}
              />
              <AgeField
                value={values.age}
                onChange={(val) => setValue('age', val)}
              />
              <GenderField
                value={values.gender}
                onChange={(val) => setValue('gender', val)}
              />
              <PersonalityField
                value={values.personality}
                onChange={(val) => setValue('personality', val)}
              />
              <SentimentField
                value={values.sentiment}
                onChange={(val) => setValue('sentiment', val)}
              />
              <AvailabilityField
                value={values.availability}
                onChange={(val) => setValue('availability', val)}
              />
            </div>

            {/* Full width interests dashboard */}
            <InterestsDashboard
              selectedInterests={values.interests}
              onChange={(interests) => setValue('interests', interests)}
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
          </form>
        )}
      </FormContainer>
    );
  }
);

AgentConfigForm.displayName = 'AgentConfigForm';

export default AgentConfigForm;
