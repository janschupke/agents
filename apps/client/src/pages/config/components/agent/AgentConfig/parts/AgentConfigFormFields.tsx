import { FormField, Textarea, Slider } from '@openai/ui';
import { useTranslation, I18nNamespace } from '@openai/i18n';
import { BehaviorRulesField } from './BehaviorRulesField';

interface DescriptionFieldProps {
  value: string;
  onChange: (value: string) => void;
}

export function DescriptionField({ value, onChange }: DescriptionFieldProps) {
  const { t } = useTranslation(I18nNamespace.CLIENT);

  return (
    <FormField label={t('config.description')} labelFor="agent-description">
      <Textarea
        id="agent-description"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        placeholder={t('config.enterDescription')}
      />
    </FormField>
  );
}

interface TemperatureFieldProps {
  value: number;
  onChange: (value: number) => void;
}

export function TemperatureField({ value, onChange }: TemperatureFieldProps) {
  const { t } = useTranslation(I18nNamespace.CLIENT);

  return (
    <Slider
      id="agent-temperature"
      value={value}
      onChange={onChange}
      min={0}
      max={2}
      step={0.1}
      label={t('config.temperature')}
      valueFormatter={(val) => val.toFixed(2)}
      labels={{
        min: t('config.temperatureDeterministic'),
        mid: t('config.temperatureBalanced'),
        max: t('config.temperatureCreative'),
      }}
    />
  );
}

interface SystemPromptFieldProps {
  value: string;
  onChange: (value: string) => void;
}

export function SystemPromptField({ value, onChange }: SystemPromptFieldProps) {
  const { t } = useTranslation(I18nNamespace.CLIENT);

  return (
    <FormField
      label={t('config.systemPrompt')}
      labelFor="agent-system-prompt"
      hint={t('config.systemPromptDescription')}
    >
      <Textarea
        id="agent-system-prompt"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        className="font-mono"
        placeholder={t('config.enterSystemPrompt')}
      />
    </FormField>
  );
}

// BehaviorRulesField is exported from its own file
export { BehaviorRulesField };
