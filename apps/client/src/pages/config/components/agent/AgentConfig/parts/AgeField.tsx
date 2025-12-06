import { Slider } from '@openai/ui';
import { useTranslation, I18nNamespace } from '@openai/i18n';
import { NUMERIC_CONSTANTS } from '@openai/shared-types';

interface AgeFieldProps {
  value: number | null;
  onChange: (value: number | null) => void;
}

export default function AgeField({ value, onChange }: AgeFieldProps) {
  const { t } = useTranslation(I18nNamespace.CLIENT);
  const ageValue = value ?? Math.max(NUMERIC_CONSTANTS.AGE_MIN, 25);

  return (
    <Slider
      id="agent-age"
      value={ageValue}
      onChange={(val) => onChange(val)}
      min={NUMERIC_CONSTANTS.AGE_MIN}
      max={NUMERIC_CONSTANTS.AGE_MAX}
      step={1}
      label={t('config.age')}
    />
  );
}
