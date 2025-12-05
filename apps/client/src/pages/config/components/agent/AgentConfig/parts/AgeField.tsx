import { Slider } from '@openai/ui';
import { useTranslation, I18nNamespace } from '@openai/i18n';

interface AgeFieldProps {
  value: number | null;
  onChange: (value: number | null) => void;
}

export default function AgeField({ value, onChange }: AgeFieldProps) {
  const { t } = useTranslation(I18nNamespace.CLIENT);
  const ageValue = value ?? 25;

  return (
    <Slider
      id="agent-age"
      value={ageValue}
      onChange={(val) => onChange(val)}
      min={0}
      max={100}
      step={1}
      label={t('config.age')}
    />
  );
}
