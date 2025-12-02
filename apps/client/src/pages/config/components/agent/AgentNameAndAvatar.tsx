import {
  AvatarPicker,
  ValidatedInput,
  FormField,
} from '@openai/ui';
import { useTranslation, I18nNamespace } from '@openai/i18n';

interface AgentNameAndAvatarProps {
  avatarUrl: string | null;
  name: string;
  nameError?: string;
  nameTouched?: boolean;
  saving: boolean;
  autoFocus?: boolean;
  onAvatarChange: (url: string | null) => void;
  onNameChange: (value: string) => void;
  onNameBlur: () => void;
}

/**
 * Combined avatar picker and name input field component
 */
export default function AgentNameAndAvatar({
  avatarUrl,
  name,
  nameError,
  nameTouched,
  saving,
  autoFocus = false,
  onAvatarChange,
  onNameChange,
  onNameBlur,
}: AgentNameAndAvatarProps) {
  const { t } = useTranslation(I18nNamespace.CLIENT);

  return (
    <div className="flex items-start gap-4">
      <AvatarPicker value={avatarUrl} onChange={onAvatarChange} />
      <div className="flex-1">
        <FormField
          label={t('config.agentName')}
          labelFor="agent-name"
          error={nameError}
          touched={nameTouched}
        >
          <ValidatedInput
            id="agent-name"
            type="text"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            onBlur={onNameBlur}
            error={nameError}
            touched={nameTouched}
            disabled={saving}
            className="w-full"
            placeholder={t('config.enterAgentName')}
            autoFocus={autoFocus}
          />
        </FormField>
      </div>
    </div>
  );
}
