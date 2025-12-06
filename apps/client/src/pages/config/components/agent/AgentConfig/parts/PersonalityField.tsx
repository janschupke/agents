import { FormField } from '@openai/ui';
import { useTranslation, I18nNamespace } from '@openai/i18n';
import { PERSONALITY_TYPES } from '@openai/shared-types';

interface PersonalityFieldProps {
  value: string;
  onChange: (value: string) => void;
}

export default function PersonalityField({
  value,
  onChange,
}: PersonalityFieldProps) {
  const { t } = useTranslation(I18nNamespace.CLIENT);

  return (
    <FormField
      label={t('config.personality')}
      labelFor="agent-personality"
      hint={t('config.personalityDescription')}
    >
      <select
        id="agent-personality"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-border-input rounded-md text-text-primary bg-background focus:outline-none focus:border-border-focus"
      >
        {PERSONALITY_TYPES.map((personality) => (
          <option key={personality} value={personality}>
            {personality}
          </option>
        ))}
      </select>
    </FormField>
  );
}
