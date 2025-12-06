import { FormField } from '@openai/ui';
import { useTranslation, I18nNamespace } from '@openai/i18n';
import { Language } from '@openai/shared-types';
import { getLanguageOptions } from '../../../../../../constants/language.constants';
import { AgentType } from '../../../../../../types/agent.types';

interface LanguageFieldProps {
  value: Language | null | undefined;
  agentType?: AgentType | null | undefined;
  onChange: (value: Language | null) => void;
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
  const languageOptions = getLanguageOptions(t);

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
        onChange={(e) => onChange((e.target.value || null) as Language | null)}
        disabled={!isEnabled}
        className="w-full px-3 py-2 border border-border-input rounded-md text-text-primary bg-background focus:outline-none focus:border-border-focus disabled:bg-disabled-bg disabled:cursor-not-allowed"
      >
        <option value="">{t('config.language.none')}</option>
        {languageOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FormField>
  );
}
