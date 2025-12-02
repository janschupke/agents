import {
  IconTrash,
  IconPlus,
  FormField,
  Button,
  Input,
  Textarea,
  ButtonVariant,
} from '@openai/ui';
import { useTranslation, I18nNamespace } from '@openai/i18n';

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
    <FormField
      label={t('config.behaviorRules')}
      hint={t('config.rulesDescription')}
    >
      <div className="space-y-2">
        {rules.map((rule, index) => (
          <div key={index} className="flex items-center gap-2">
            <Input
              type="text"
              value={rule}
              onChange={(e) => {
                const newRules = [...rules];
                newRules[index] = e.target.value;
                onChange(newRules);
              }}
              className="flex-1"
              placeholder={t('config.rulePlaceholder', {
                index: (index + 1).toString(),
              })}
            />
            <Button
              type="button"
              onClick={() => {
                const newRules = rules.filter((_, i) => i !== index);
                onChange(newRules);
              }}
              variant={ButtonVariant.SECONDARY}
              size="sm"
              className="w-8 p-0"
              tooltip={t('config.removeRule')}
            >
              <IconTrash className="w-4 h-4" />
            </Button>
          </div>
        ))}
        <Button
          type="button"
          onClick={() => onChange([...rules, ''])}
          variant={ButtonVariant.SECONDARY}
          size="sm"
          className="w-full"
        >
          <IconPlus className="w-4 h-4" />
          <span>{t('config.addRule')}</span>
        </Button>
      </div>
    </FormField>
  );
}
