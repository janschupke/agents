import { FormField } from '@openai/ui';
import { useTranslation, I18nNamespace } from '@openai/i18n';
import { Gender } from '../../../../../../types/agent.types';
import { getButtonSizeClasses } from '@openai/ui';

interface GenderFieldProps {
  value: Gender | null;
  onChange: (value: Gender | null) => void;
}

/**
 * 3-state gender toggle: Male, Female, Other
 * Clicking the same button again deselects it (returns to null)
 */
export default function GenderField({ value, onChange }: GenderFieldProps) {
  const { t } = useTranslation(I18nNamespace.CLIENT);
  const sizeClasses = getButtonSizeClasses('md');

  const handleToggle = (gender: Gender) => {
    // If clicking the same gender, deselect it (set to null)
    if (value === gender) {
      onChange(null);
    } else {
      onChange(gender);
    }
  };

  return (
    <FormField label={t('config.gender')} labelFor="agent-gender">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => handleToggle(Gender.MALE)}
          className={`${sizeClasses} rounded-md border transition-colors ${
            value === Gender.MALE
              ? 'bg-primary text-text-inverse border-primary hover:bg-primary-hover'
              : 'bg-background-secondary text-text-primary border-border hover:border-border-focus'
          }`}
        >
          {t('config.genderMale')}
        </button>
        <button
          type="button"
          onClick={() => handleToggle(Gender.FEMALE)}
          className={`${sizeClasses} rounded-md border transition-colors ${
            value === Gender.FEMALE
              ? 'bg-primary text-text-inverse border-primary hover:bg-primary-hover'
              : 'bg-background-secondary text-text-primary border-border hover:border-border-focus'
          }`}
        >
          {t('config.genderFemale')}
        </button>
        <button
          type="button"
          onClick={() => handleToggle(Gender.NON_BINARY)}
          className={`${sizeClasses} rounded-md border transition-colors ${
            value === Gender.NON_BINARY
              ? 'bg-primary text-text-inverse border-primary hover:bg-primary-hover'
              : 'bg-background-secondary text-text-primary border-border hover:border-border-focus'
          }`}
        >
          {t('config.genderOther')}
        </button>
      </div>
    </FormField>
  );
}
