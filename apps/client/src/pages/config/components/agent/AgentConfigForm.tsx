import { Agent } from '../../../../types/chat.types';
import { PageHeader } from '@openai/ui';
import { useAgent } from '../../../../hooks/queries/use-agents';
import { useAgentMemories as useAgentMemoriesQuery } from '../../../../hooks/queries/use-agents';
import { useAgentForm } from '../../hooks/use-agent-form';
import { useAgentMemories } from '../../hooks/use-agent-memories';
import { useFadeInOnChange } from '../../hooks/use-fade-in-on-change';
import { useTranslation, I18nNamespace } from '@openai/i18n';
import {
  FormButton,
  FormContainer,
  ButtonType,
  ButtonVariant,
  FadeIn,
} from '@openai/ui';
import {
  DescriptionField,
  TemperatureField,
  SystemPromptField,
  BehaviorRulesField,
} from './AgentConfigFormFields';
import AgentConfigFormSkeleton from './AgentConfigFormSkeleton';
import AgentNameAndAvatar from './AgentNameAndAvatar';
import MemoriesSection from './MemoriesSection';

interface AgentConfigFormProps {
  agent: Agent | null;
  saving?: boolean;
  onSaveClick: (
    agent: Agent,
    values: ReturnType<typeof useAgentForm>['values']
  ) => Promise<void>;
}

export default function AgentConfigForm({
  agent,
  saving = false,
  onSaveClick,
}: AgentConfigFormProps) {
  // Track agent ID changes to trigger fade-in animation
  const fadeKey = useFadeInOnChange(agent?.id);

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

  const { t } = useTranslation(I18nNamespace.CLIENT);

  if (!agent) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-text-tertiary text-center text-sm">
          {t('config.selectAgent')}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <PageHeader
        title={t('config.title')}
        actions={
          <FormButton
            type={ButtonType.BUTTON}
            onClick={handleSave}
            loading={saving}
            disabled={!values.name.trim()}
            variant={ButtonVariant.PRIMARY}
            tooltip={
              saving
                ? t('config.saving')
                : agent.id < 0
                  ? t('config.createAgent')
                  : t('config.saveButton')
            }
          >
            {agent.id < 0 ? t('config.createAgent') : t('config.saveButton')}
          </FormButton>
        }
      />
      <div className="flex-1 overflow-y-auto p-5">
        <FormContainer saving={saving}>
          {loadingConfig ? (
            <AgentConfigFormSkeleton />
          ) : (
            <FadeIn key={fadeKey}>
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
            </FadeIn>
          )}
        </FormContainer>
      </div>
    </div>
  );
}
