import { AvatarInput, Textarea, FormField } from '@openai/ui';
import { useTranslation, I18nNamespace } from '@openai/i18n';

interface AgentNameAndAvatarProps {
  avatarUrl: string | null;
  description: string; // This is now the system prompt (renamed to Description)
  descriptionError?: string;
  saving: boolean;
  onAvatarChange: (url: string | null) => void;
  onDescriptionChange: (value: string) => void;
}

/**
 * Combined avatar picker and description field component
 */
export default function AgentNameAndAvatar({
  avatarUrl,
  description,
  descriptionError,
  saving,
  onAvatarChange,
  onDescriptionChange,
}: AgentNameAndAvatarProps) {
  const { t } = useTranslation(I18nNamespace.CLIENT);

  return (
    <div className="flex items-start gap-4">
      <AvatarInput
        value={avatarUrl}
        onChange={onAvatarChange}
        disabled={saving}
        allowUrlInput={true}
      />
      <div className="flex-1">
        <FormField
          label={t('config.description')}
          labelFor="agent-description"
          error={descriptionError}
        >
          <Textarea
            id="agent-description"
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            rows={4}
            placeholder={t('config.enterDescription')}
            disabled={saving}
          />
        </FormField>
      </div>
    </div>
  );
}
