import { FormField } from '@openai/ui';
import { useTranslation, I18nNamespace } from '@openai/i18n';

interface AgeFieldProps {
  value: number | null;
  onChange: (value: number | null) => void;
}

export default function AgeField({ value, onChange }: AgeFieldProps) {
  const { t } = useTranslation(I18nNamespace.CLIENT);
  const ageValue = value ?? 25;

  return (
    <FormField
      label={
        <>
          {t('config.age')}: <span className="font-mono">{ageValue}</span>
        </>
      }
      labelFor="agent-age"
    >
      <div className="relative">
        <input
          id="agent-age"
          type="range"
          min="0"
          max="100"
          step="1"
          value={ageValue}
          onChange={(e) => onChange(parseInt(e.target.value, 10))}
          className="w-full h-2 bg-background rounded-lg appearance-none cursor-pointer accent-primary"
          style={{
            background: `linear-gradient(to right, rgb(var(--color-primary)) 0%, rgb(var(--color-primary)) ${(ageValue / 100) * 100}%, rgb(var(--color-border)) ${(ageValue / 100) * 100}%, rgb(var(--color-border)) 100%)`,
          }}
        />
      </div>
    </FormField>
  );
}
