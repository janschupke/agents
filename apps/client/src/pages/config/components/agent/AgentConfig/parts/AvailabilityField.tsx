import { FormField } from '@openai/ui';
import { useTranslation, I18nNamespace } from '@openai/i18n';
import { Availability } from '../../../../../../types/agent.types';

interface AvailabilityFieldProps {
  value: Availability;
  onChange: (value: Availability) => void;
}

export default function AvailabilityField({
  value,
  onChange,
}: AvailabilityFieldProps) {
  const { t } = useTranslation(I18nNamespace.CLIENT);

  return (
    <FormField
      label={t('config.availability')}
      labelFor="agent-availability"
      hint={t('config.availabilityDescription')}
    >
      <select
        id="agent-availability"
        value={value}
        onChange={(e) => onChange(e.target.value as Availability)}
        className="w-full px-3 py-2 border border-border-input rounded-md text-text-primary bg-background focus:outline-none focus:border-border-focus"
      >
        {Object.values(Availability).map((availability) => (
          <option key={availability} value={availability}>
            {t(
              `config.availability${availability
                .split('-')
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join('')}`
            )}
          </option>
        ))}
      </select>
    </FormField>
  );
}
