import { FormField } from '@openai/ui';
import { useTranslation, I18nNamespace } from '@openai/i18n';
import { ResponseLength } from '../../../../../../types/agent.types';

interface ResponseLengthFieldProps {
  value: ResponseLength | null;
  onChange: (value: ResponseLength | null) => void;
}

export default function ResponseLengthField({
  value,
  onChange,
}: ResponseLengthFieldProps) {
  const { t } = useTranslation(I18nNamespace.CLIENT);

  return (
    <FormField
      label={t('config.responseLength')}
      labelFor="agent-response-length"
    >
      <select
        id="agent-response-length"
        value={value || ''}
        onChange={(e) =>
          onChange(e.target.value ? (e.target.value as ResponseLength) : null)
        }
        className="w-full px-3 py-2 border border-border-input rounded-md text-text-primary bg-background focus:outline-none focus:border-border-focus"
      >
        <option value="">{t('config.selectResponseLength')}</option>
        <option value={ResponseLength.SHORT}>{t('config.responseLengthShort')}</option>
        <option value={ResponseLength.STANDARD}>{t('config.responseLengthStandard')}</option>
        <option value={ResponseLength.LONG}>{t('config.responseLengthLong')}</option>
        <option value={ResponseLength.ADAPT}>{t('config.responseLengthAdapt')}</option>
      </select>
    </FormField>
  );
}
