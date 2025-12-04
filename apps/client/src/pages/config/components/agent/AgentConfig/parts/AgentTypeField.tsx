import { FormField } from '@openai/ui';
import { useTranslation, I18nNamespace } from '@openai/i18n';
import { AgentType } from '../../../../../../types/agent.types';

interface AgentTypeFieldProps {
  value: AgentType | null | undefined;
  onChange: (value: AgentType) => void;
  error?: string | null;
  touched?: boolean;
}

export default function AgentTypeField({
  value,
  onChange,
  error,
  touched,
}: AgentTypeFieldProps) {
  const { t } = useTranslation(I18nNamespace.CLIENT);

  return (
    <FormField
      label={t('config.agentType.label')}
      labelFor="agent-type"
      hint={t('config.agentType.description')}
      error={error}
      touched={touched}
    >
      <select
        id="agent-type"
        value={value || AgentType.GENERAL}
        onChange={(e) => onChange(e.target.value as AgentType)}
        className="w-full px-3 py-2 border border-border-input rounded-md text-text-primary bg-background focus:outline-none focus:border-border-focus disabled:bg-disabled-bg disabled:cursor-not-allowed"
      >
        <option value={AgentType.GENERAL}>
          {t('config.agentType.general')}
        </option>
        <option value={AgentType.LANGUAGE_ASSISTANT}>
          {t('config.agentType.languageAssistant')}
        </option>
      </select>
    </FormField>
  );
}
