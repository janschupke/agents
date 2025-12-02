import { IconTrash, IconPlus } from '../../../../components/ui/Icons';
import { useTranslation, I18nNamespace } from '@openai/i18n';

interface DescriptionFieldProps {
  value: string;
  onChange: (value: string) => void;
}

export function DescriptionField({ value, onChange }: DescriptionFieldProps) {
  const { t } = useTranslation(I18nNamespace.CLIENT);
  
  return (
    <div>
      <label
        htmlFor="agent-description"
        className="block text-sm font-medium text-text-secondary mb-1.5"
      >
        {t('config.description')}
      </label>
      <textarea
        id="agent-description"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="w-full px-3 py-2 border border-border-input rounded-md text-sm text-text-primary bg-background focus:outline-none focus:border-border-focus resize-none"
        placeholder={t('config.enterDescription')}
      />
    </div>
  );
}

interface TemperatureFieldProps {
  value: number;
  onChange: (value: number) => void;
}

export function TemperatureField({ value, onChange }: TemperatureFieldProps) {
  const { t } = useTranslation(I18nNamespace.CLIENT);
  
  return (
    <div>
      <label
        htmlFor="agent-temperature"
        className="block text-sm font-medium text-text-secondary mb-1.5"
      >
        {t('config.temperature')}: <span className="font-mono">{value.toFixed(2)}</span>
      </label>
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
    </div>
  );
}

interface SystemPromptFieldProps {
  value: string;
  onChange: (value: string) => void;
}

export function SystemPromptField({ value, onChange }: SystemPromptFieldProps) {
  const { t } = useTranslation(I18nNamespace.CLIENT);
  
  return (
    <div>
      <label
        htmlFor="agent-system-prompt"
        className="block text-sm font-medium text-text-secondary mb-1.5"
      >
        {t('config.systemPrompt')}
      </label>
      <textarea
        id="agent-system-prompt"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        className="w-full px-3 py-2 border border-border-input rounded-md text-sm text-text-primary bg-background focus:outline-none focus:border-border-focus resize-none font-mono"
        placeholder={t('config.enterSystemPrompt')}
      />
      <p className="text-xs text-text-tertiary mt-1">
        {t('config.systemPromptDescription')}
      </p>
    </div>
  );
}

interface BehaviorRulesFieldProps {
  rules: string[];
  onChange: (rules: string[]) => void;
}

export function BehaviorRulesField({
  rules,
  onChange,
}: BehaviorRulesFieldProps) {
  const { t } = useTranslation(I18nNamespace.CLIENT);
  
  return (
    <div>
      <label className="block text-sm font-medium text-text-secondary mb-1.5">
        {t('config.behaviorRules')}
      </label>
      <div className="space-y-2">
        {rules.map((rule, index) => (
          <div key={index} className="flex items-center gap-2">
            <input
              type="text"
              value={rule}
              onChange={(e) => {
                const newRules = [...rules];
                newRules[index] = e.target.value;
                onChange(newRules);
              }}
              className="flex-1 h-8 px-3 border border-border-input rounded-md text-sm text-text-primary bg-background focus:outline-none focus:border-border-focus"
              placeholder={t('config.rulePlaceholder', { index: (index + 1).toString() })}
            />
            <button
              type="button"
              onClick={() => {
                const newRules = rules.filter((_, i) => i !== index);
                onChange(newRules);
              }}
              className="h-8 w-8 flex items-center justify-center text-text-tertiary hover:text-red-600 hover:bg-background-tertiary rounded transition-colors flex-shrink-0"
              title={t('config.removeRule')}
            >
              <IconTrash className="w-4 h-4" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => onChange([...rules, ''])}
          className="w-full h-8 px-3 bg-background border border-border rounded-md text-sm text-text-primary hover:bg-background-tertiary transition-colors flex items-center justify-center gap-1.5"
        >
          <IconPlus className="w-4 h-4" />
          <span>{t('config.addRule')}</span>
        </button>
      </div>
      <p className="text-xs text-text-tertiary mt-2">
        {t('config.rulesDescription')}
      </p>
    </div>
  );
}
