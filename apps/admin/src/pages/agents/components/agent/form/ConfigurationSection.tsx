import { useTranslation, I18nNamespace } from '@openai/i18n';
import { Input, Slider } from '@openai/ui';

interface ConfigurationSectionProps {
  formValues: {
    temperature: string;
    maxTokens: string;
    model: string;
  };
  errors: Record<string, string>;
  isArchetype: boolean;
  onFieldChange: (field: string, value: string) => void;
}

export default function ConfigurationSection({
  formValues,
  errors,
  isArchetype,
  onFieldChange,
}: ConfigurationSectionProps) {
  const { t } = useTranslation(I18nNamespace.ADMIN);

  const temperatureValue = formValues.temperature
    ? parseFloat(formValues.temperature)
    : 0.7;
  const maxTokensValue = formValues.maxTokens
    ? parseInt(formValues.maxTokens, 10)
    : 1000;

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium text-text-secondary">
        {isArchetype ? t('archetypes.form.configuration') : 'Configuration'}
      </h4>

      <div className="grid grid-cols-2 gap-4">
        <Slider
          id="agent-temperature"
          value={temperatureValue}
          onChange={(val) => onFieldChange('temperature', val.toString())}
          min={0}
          max={2}
          step={0.1}
          label={isArchetype ? t('archetypes.form.temperature') : 'Temperature'}
          valueFormatter={(val) => val.toFixed(2)}
          error={errors.temperature}
          labels={{
            min: 'Deterministic',
            mid: 'Balanced',
            max: 'Creative',
          }}
        />

        <Slider
          id="agent-max-tokens"
          value={maxTokensValue}
          onChange={(val) => onFieldChange('maxTokens', val.toString())}
          min={1}
          max={4000}
          step={1}
          label={isArchetype ? t('archetypes.form.maxTokens') : 'Max Tokens'}
          error={errors.maxTokens}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-text-primary mb-1">
          {isArchetype ? t('archetypes.form.model') : 'Model'}
        </label>
        <Input
          type="text"
          value={formValues.model}
          onChange={(e) => onFieldChange('model', e.target.value)}
          placeholder="gpt-4, gpt-3.5-turbo, etc."
        />
      </div>
    </div>
  );
}
