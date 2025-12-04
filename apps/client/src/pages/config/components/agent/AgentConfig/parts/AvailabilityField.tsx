import { FormField } from '@openai/ui';
import { useTranslation, I18nNamespace } from '@openai/i18n';
import { Availability } from '../../../../../../types/agent.types';

interface AvailabilityFieldProps {
  value: Availability | null;
  onChange: (value: Availability | null) => void;
}

export default function AvailabilityField({
  value,
  onChange,
}: AvailabilityFieldProps) {
  const { t } = useTranslation(I18nNamespace.CLIENT);

  return (
    <FormField label={t('config.availability')} labelFor="agent-availability">
      <select
        id="agent-availability"
        value={value || ''}
        onChange={(e) =>
          onChange(e.target.value ? (e.target.value as Availability) : null)
        }
        className="w-full px-3 py-2 border border-border-input rounded-md text-text-primary bg-background focus:outline-none focus:border-border-focus"
      >
        <option value="">{t('config.selectAvailability')}</option>
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
