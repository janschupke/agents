import { Agent } from '../../../../../../types/chat.types';
import { useAgent } from '../../../../../../hooks/queries/use-agents';
import { useAgentForm } from '../../../../hooks/agent/use-agent-form';
import { useTranslation, I18nNamespace } from '@openai/i18n';
import { Language } from '@openai/shared-types';
import { FormContainer } from '@openai/ui';
import { TemperatureField, BehaviorRulesField } from './AgentConfigFormFields';
import AgentConfigFormSkeleton from './AgentConfigFormSkeleton';
import AgentNameAndAvatar from './AgentNameAndAvatar';
import MemorySummary from './MemorySummary';
import AgentTypeField from './AgentTypeField';
import LanguageField from './LanguageField';
import ResponseLengthField from './ResponseLengthField';
import AgeField from './AgeField';
import GenderField from './GenderField';
import PersonalityField from './PersonalityField';
import SentimentField from './SentimentField';
import AvailabilityField from './AvailabilityField';
import InterestsDashboard from './InterestsDashboard';
import ArchetypeSelector from './ArchetypeSelector';
import {
  forwardRef,
  useImperativeHandle,
  useEffect,
  useRef,
  useState,
} from 'react';
import { AgentArchetype } from '../../../../../../types/agent-archetype.types';
import {
  ResponseLength,
  Gender,
  Sentiment,
  Availability,
} from '../../../../../../types/agent.types';
import { PersonalityType } from '@openai/shared-types';

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

    // Form management hook
    const {
      values,
      errors,
      touched: _touched,
      setValue,
      setTouched,
      validateAll,
    } = useAgentForm({ agent, agentData: agentData || null });

    // State for selected archetype (only for new agents)
    const isNewAgent = agent && agent.id < 0;
    const [selectedArchetypeId, setSelectedArchetypeId] = useState<
      number | null
    >(null);

    // Handler to pre-fill form from archetype
    const handleArchetypeSelect = (archetype: AgentArchetype) => {
      setSelectedArchetypeId(archetype.id);

      // Pre-fill form with archetype data
      if (archetype.name) setValue('name', archetype.name);
      if (archetype.description)
        setValue('description', archetype.description || '');
      if (archetype.avatarUrl) setValue('avatarUrl', archetype.avatarUrl);
      if (archetype.agentType) setValue('agentType', archetype.agentType);
      if (archetype.language) setValue('language', archetype.language);

      // Pre-fill configs
      const configs = archetype.configs || {};
      if (configs.temperature !== undefined)
        setValue('temperature', configs.temperature as number);
      if (configs.system_prompt)
        setValue('description', configs.system_prompt as string);
      if (configs.behavior_rules) {
        const rules = Array.isArray(configs.behavior_rules)
          ? configs.behavior_rules
          : typeof configs.behavior_rules === 'object' &&
              'rules' in configs.behavior_rules
            ? (configs.behavior_rules as { rules: string[] }).rules
            : [];
        setValue('behaviorRules', rules);
      }
      if (configs.response_length)
        setValue('responseLength', configs.response_length as ResponseLength);
      if (configs.age !== undefined) setValue('age', configs.age as number);
      if (configs.gender) setValue('gender', configs.gender as Gender);
      if (configs.personality)
        setValue('personality', configs.personality as PersonalityType);
      if (configs.sentiment)
        setValue('sentiment', configs.sentiment as Sentiment);
      if (configs.interests)
        setValue('interests', configs.interests as string[]);
      if (configs.availability)
        setValue('availability', configs.availability as Availability);
    };

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
      <>
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
              {/* Archetype selector - only show for new agents */}
              {isNewAgent && (
                <ArchetypeSelector
                  selectedArchetypeId={selectedArchetypeId}
                  onArchetypeSelect={handleArchetypeSelect}
                />
              )}

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
                  value={values.language as Language | null | undefined}
                  agentType={values.agentType}
                  onChange={(val) => setValue('language', val as string | null)}
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
                  onChange={(val) =>
                    setValue('personality', val as typeof values.personality)
                  }
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

              <MemorySummary
                summary={agentData?.memorySummary}
                loading={loadingAgent}
              />
            </form>
          )}
        </FormContainer>
      </>
    );
  }
);

AgentConfigForm.displayName = 'AgentConfigForm';

export default AgentConfigForm;
