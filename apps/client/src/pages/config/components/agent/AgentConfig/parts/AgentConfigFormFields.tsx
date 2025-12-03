import { FormField, Textarea } from '@openai/ui';
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
    <FormField
      label={
        <>
          {t('config.temperature')}:{' '}
          <span className="font-mono">{value.toFixed(2)}</span>
        </>
      }
      labelFor="agent-temperature"
    >
      <div className="relative">
        <input
          id="agent-temperature"
          type="range"
          min="0"
          max="2"
          step="0.1"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-full h-2 bg-background rounded-lg appearance-none cursor-pointer accent-primary"
          style={{
            background: `linear-gradient(to right, rgb(var(--color-primary)) 0%, rgb(var(--color-primary)) ${(value / 2) * 100}%, rgb(var(--color-border)) ${(value / 2) * 100}%, rgb(var(--color-border)) 100%)`,
          }}
        />
      </div>
      <div className="flex justify-between text-xs text-text-tertiary mt-1">
        <span>{t('config.temperatureDeterministic')}</span>
        <span>{t('config.temperatureBalanced')}</span>
        <span>{t('config.temperatureCreative')}</span>
      </div>
    </FormField>
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
