import { SectionHeader, Card } from '@openai/ui';
import { useTranslation, I18nNamespace } from '@openai/i18n';

interface MemorySummaryProps {
  summary: string | null | undefined;
  loading?: boolean;
}

/**
 * Component for displaying memory summary for client view
 * Shows how agent's memories affect its feelings and behavioral tendencies
 */
export default function MemorySummary({
  summary,
  loading = false,
}: MemorySummaryProps) {
  const { t } = useTranslation(I18nNamespace.CLIENT);

  return (
    <div>
      <SectionHeader
        title={t('agentConfig.memorySummary.title')}
        className="mb-3"
      />
      {loading ? (
        <Card padding="md" variant="outlined">
          <div className="text-text-tertiary text-sm">
            {t('agentConfig.memorySummary.loading')}
          </div>
        </Card>
      ) : summary ? (
        <Card padding="md" variant="outlined">
          <div className="text-sm text-text-primary leading-relaxed">
            {summary}
          </div>
        </Card>
      ) : (
        <Card padding="md" variant="outlined">
          <div className="text-text-tertiary text-sm text-center py-4">
            {t('agentConfig.memorySummary.empty')}
          </div>
        </Card>
      )}
    </div>
  );
}
