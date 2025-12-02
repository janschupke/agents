import { Bot } from '../../../../types/chat.types.js';
import { PageHeader } from '../../../../components/ui/layout';
import { useBot } from '../../../../hooks/queries/use-bots.js';
import { useBotMemories as useBotMemoriesQuery } from '../../../../hooks/queries/use-bots.js';
import { useBotForm } from '../../hooks/use-bot-form.js';
import { useBotMemories } from '../../hooks/use-bot-memories.js';
import { FormButton, FormContainer, ButtonType, ButtonVariant } from '../../../../components/ui/form';
import {
  DescriptionField,
  TemperatureField,
  SystemPromptField,
  BehaviorRulesField,
} from './BotConfigFormFields';
import BotConfigFormSkeleton from './BotConfigFormSkeleton';
import BotNameAndAvatar from './BotNameAndAvatar';
import MemoriesSection from './MemoriesSection';

interface BotConfigFormProps {
  bot: Bot | null;
  saving?: boolean;
  onSaveClick: (bot: Bot, values: ReturnType<typeof useBotForm>['values']) => Promise<void>;
}

export default function BotConfigForm({ bot, saving = false, onSaveClick }: BotConfigFormProps) {
  // React Query hooks
  const { data: botData, isLoading: loadingBot } = useBot(bot?.id || null);
  const { data: memories = [], isLoading: loadingMemories } = useBotMemoriesQuery(bot?.id || null);

  // Form management hook
  const {
    values,
    errors,
    touched,
    setValue,
    setTouched,
    validateAll,
  } = useBotForm({ bot, botData: botData || null });

  // Memory operations hook
  const {
    editingId,
    deletingId,
    handleDeleteMemory,
    handleEditMemory,
    handleRefreshMemories,
  } = useBotMemories({ botId: bot?.id || null });

  const loadingConfig = loadingBot && bot !== null && bot.id > 0;

  const handleSave = async () => {
    if (!bot) return;

    // Validate form
    const validation = validateAll();
    if (!validation.isValid) {
      return;
    }

    await onSaveClick(bot, values);
  };

  if (!bot) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-text-tertiary text-center text-sm">Select a bot to configure</div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <PageHeader
        title="Bot Configuration"
        actions={
          <FormButton
            type={ButtonType.BUTTON}
            onClick={handleSave}
            loading={saving}
            disabled={!values.name.trim()}
            variant={ButtonVariant.PRIMARY}
            tooltip={saving ? 'Saving...' : bot.id < 0 ? 'Create Bot' : 'Save'}
          >
            {bot.id < 0 ? 'Create Bot' : 'Save'}
          </FormButton>
        }
      />
      <div className="flex-1 overflow-y-auto p-5">
        <FormContainer saving={saving}>
          {loadingConfig ? (
            <BotConfigFormSkeleton />
          ) : (
            <div className="space-y-5">
              <BotNameAndAvatar
                avatarUrl={values.avatarUrl}
                name={values.name}
                nameError={errors.name}
                nameTouched={touched.name}
                saving={saving}
                autoFocus={bot.id < 0}
                onAvatarChange={(url) => setValue('avatarUrl', url)}
                onNameChange={(value) => setValue('name', value)}
                onNameBlur={() => setTouched('name')}
              />
              <DescriptionField value={values.description} onChange={(val) => setValue('description', val)} />
              <TemperatureField value={values.temperature} onChange={(val) => setValue('temperature', val)} />
              <SystemPromptField value={values.systemPrompt} onChange={(val) => setValue('systemPrompt', val)} />
              <BehaviorRulesField rules={values.behaviorRules} onChange={(rules) => setValue('behaviorRules', rules)} />

              <MemoriesSection
                botId={bot.id}
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
      </div>
    </div>
  );
}
