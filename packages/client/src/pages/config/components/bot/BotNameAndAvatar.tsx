import AvatarPicker from '../../../../components/ui/AvatarPicker.js';
import ValidatedInput from '../../../../components/ui/ValidatedInput.js';

interface BotNameAndAvatarProps {
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
export default function BotNameAndAvatar({
  avatarUrl,
  name,
  nameError,
  nameTouched,
  saving,
  autoFocus = false,
  onAvatarChange,
  onNameChange,
  onNameBlur,
}: BotNameAndAvatarProps) {
  return (
    <div className="flex items-start gap-4">
      <AvatarPicker value={avatarUrl} onChange={onAvatarChange} />
      <div className="flex-1">
        <div>
          <label htmlFor="bot-name" className="block text-sm font-medium text-text-secondary mb-1.5">
            Bot Name
          </label>
          <ValidatedInput
            id="bot-name"
            type="text"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            onBlur={onNameBlur}
            error={nameError}
            touched={nameTouched}
            disabled={saving}
            className="w-full"
            placeholder="Enter bot name"
            autoFocus={autoFocus}
          />
        </div>
      </div>
    </div>
  );
}
