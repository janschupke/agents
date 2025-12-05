import { useTranslation, I18nNamespace } from '@openai/i18n';
import { Input, Textarea } from '@openai/ui';

interface ConfigurationSectionProps {
  formValues: {
    temperature: string;
    maxTokens: string;
    model: string;
    systemPrompt: string;
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

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium text-text-secondary">
        {isArchetype ? t('archetypes.form.configuration') : 'Configuration'}
      </h4>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">
            {isArchetype ? t('archetypes.form.temperature') : 'Temperature'}{' '}
            (0-2)
          </label>
          <Input
            type="number"
            step="0.1"
            min="0"
            max="2"
            value={formValues.temperature}
            onChange={(e) => onFieldChange('temperature', e.target.value)}
            className={errors.temperature ? 'border-red-500' : ''}
          />
          {errors.temperature && (
            <p className="text-red-500 text-xs mt-1">{errors.temperature}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">
            {isArchetype ? t('archetypes.form.maxTokens') : 'Max Tokens'}
          </label>
          <Input
            type="number"
            min="1"
            value={formValues.maxTokens}
            onChange={(e) => onFieldChange('maxTokens', e.target.value)}
            className={errors.maxTokens ? 'border-red-500' : ''}
          />
          {errors.maxTokens && (
            <p className="text-red-500 text-xs mt-1">{errors.maxTokens}</p>
          )}
        </div>
      </div>

      {isArchetype && (
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">
            {t('archetypes.form.systemPrompt')}
          </label>
          <Textarea
            value={formValues.systemPrompt}
            onChange={(e) => onFieldChange('systemPrompt', e.target.value)}
            rows={4}
          />
        </div>
      )}

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
