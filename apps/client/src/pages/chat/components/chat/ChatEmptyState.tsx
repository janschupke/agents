import { PageContainer } from '../../../../components/ui/layout';
import { useTranslation, I18nNamespace } from '@openai/i18n';

export default function ChatEmptyState() {
  const { t } = useTranslation(I18nNamespace.CLIENT);

  return (
    <PageContainer>
      <div className="flex h-full items-center justify-center">
        <div className="text-text-secondary text-center">
          <p className="mb-2">{t('chat.noAgents')}</p>
          <p className="text-sm text-text-tertiary">
            {t('chat.createAgentFirst')}
          </p>
        </div>
      </div>
    </PageContainer>
  );
}
