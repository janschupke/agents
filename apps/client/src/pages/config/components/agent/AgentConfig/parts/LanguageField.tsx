import { FormField } from '@openai/ui';
import { useTranslation, I18nNamespace } from '@openai/i18n';
import { LANGUAGE_OPTIONS } from '../../../../../../constants/language.constants';
import { AgentType } from '../../../../../../types/agent.types';

interface LanguageFieldProps {
  value: string | null | undefined;
  agentType?: AgentType | null | undefined;
  onChange: (value: string | null) => void;
  error?: string | null;
  touched?: boolean;
}

export default function LanguageField({
  value,
  onChange,
  error,
  touched,
}: LanguageFieldProps) {
  const { t } = useTranslation(I18nNamespace.CLIENT);

  // Language field is available for both general agents and language assistants
  const isEnabled = true;

  return (
    <FormField
      label={t('config.language.label')}
      labelFor="agent-language"
      hint={t('config.language.description')}
      error={error}
      touched={touched}
    >
      <select
        id="agent-language"
        value={value || ''}
        onChange={(e) => onChange(e.target.value || null)}
        disabled={!isEnabled}
        className="w-full px-3 py-2 border border-border-input rounded-md text-text-primary bg-background focus:outline-none focus:border-border-focus disabled:bg-disabled-bg disabled:cursor-not-allowed"
      >
        <option value="">{t('config.language.none')}</option>
        {LANGUAGE_OPTIONS.map((option: { value: string; label: string }) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FormField>
  );
}
