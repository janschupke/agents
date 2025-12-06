import { FormField } from '@openai/ui';
import { useTranslation, I18nNamespace } from '@openai/i18n';
import { Sentiment } from '../../../../../../types/agent.types';

interface SentimentFieldProps {
  value: Sentiment;
  onChange: (value: Sentiment) => void;
}

export default function SentimentField({
  value,
  onChange,
}: SentimentFieldProps) {
  const { t } = useTranslation(I18nNamespace.CLIENT);

  return (
    <FormField
      label={t('config.sentiment')}
      labelFor="agent-sentiment"
      hint={t('config.sentimentDescription')}
    >
      <select
        id="agent-sentiment"
        value={value}
        onChange={(e) => onChange(e.target.value as Sentiment)}
        className="w-full px-3 py-2 border border-border-input rounded-md text-text-primary bg-background focus:outline-none focus:border-border-focus"
      >
        {Object.values(Sentiment).map((sentiment) => (
          <option key={sentiment} value={sentiment}>
            {t(
              `config.sentiment${sentiment
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
