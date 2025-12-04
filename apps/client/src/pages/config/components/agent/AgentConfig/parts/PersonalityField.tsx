import { FormField } from '@openai/ui';
import { useTranslation, I18nNamespace } from '@openai/i18n';
import { PERSONALITY_TYPES } from '@openai/shared-types';

interface PersonalityFieldProps {
  value: string | null;
  onChange: (value: string | null) => void;
}

export default function PersonalityField({
  value,
  onChange,
}: PersonalityFieldProps) {
  const { t } = useTranslation(I18nNamespace.CLIENT);

  return (
    <FormField label={t('config.personality')} labelFor="agent-personality">
      <select
        id="agent-personality"
        value={value || ''}
        onChange={(e) => onChange(e.target.value || null)}
        className="w-full px-3 py-2 border border-border-input rounded-md text-text-primary bg-background focus:outline-none focus:border-border-focus"
      >
        <option value="">{t('config.selectPersonality')}</option>
        {PERSONALITY_TYPES.map((personality) => (
          <option key={personality} value={personality}>
            {personality}
          </option>
        ))}
      </select>
    </FormField>
  );
}
