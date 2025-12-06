import { Card, Button } from '@openai/ui';
import { useTranslation, I18nNamespace } from '@openai/i18n';
import { useGenerateMemorySummary } from '../../../../../../hooks/mutations/use-agent-mutations';

interface MemorySummaryProps {
  summary: string | null | undefined;
  loading?: boolean;
  agentId?: number | null;
}

/**
 * Component for displaying memory summary for client view
 * Shows how agent's memories affect its feelings and behavioral tendencies
 */
export default function MemorySummary({
  summary,
  loading = false,
  agentId,
}: MemorySummaryProps) {
  const { t } = useTranslation(I18nNamespace.CLIENT);
  const generateSummaryMutation = useGenerateMemorySummary();

  const handleGenerateSummary = async () => {
    if (!agentId || agentId < 0) return;
    await generateSummaryMutation.mutateAsync(agentId);
  };

  const isGenerating = generateSummaryMutation.isPending;
  // const canGenerate = agentId && agentId > 0 && !summary && !loading;
  const canGenerate = true;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold text-text-secondary">
          {t('agentConfig.memorySummary.title')}
        </h3>
        {canGenerate && (
          <Button
            onClick={handleGenerateSummary}
            disabled={isGenerating}
            loading={isGenerating}
            variant="ghost"
            size="sm"
          >
            {t('agentConfig.memorySummary.generate')}
          </Button>
        )}
      </div>
      {loading || isGenerating ? (
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
