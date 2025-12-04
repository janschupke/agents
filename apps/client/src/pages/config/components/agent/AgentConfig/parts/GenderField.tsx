import { FormField } from '@openai/ui';
import { useTranslation, I18nNamespace } from '@openai/i18n';
import { Gender } from '../../../../../../types/agent.types';

interface GenderFieldProps {
  value: Gender | null;
  onChange: (value: Gender | null) => void;
}

export default function GenderField({ value, onChange }: GenderFieldProps) {
  const { t } = useTranslation(I18nNamespace.CLIENT);

  return (
    <FormField label={t('config.gender')} labelFor="agent-gender">
      <div className="flex gap-4">
        {Object.values(Gender).map((gender) => (
          <label key={gender} className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="gender"
              value={gender}
              checked={value === gender}
              onChange={(e) =>
                onChange(e.target.checked ? (gender as Gender) : null)
              }
              className="accent-primary"
            />
            <span>
              {t(
                `config.gender${gender
                  .split('-')
                  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                  .join('')}`
              )}
            </span>
          </label>
        ))}
      </div>
    </FormField>
  );
}
