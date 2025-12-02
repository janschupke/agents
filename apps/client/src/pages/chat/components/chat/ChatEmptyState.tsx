import { PageContainer, EmptyState } from '@openai/ui';
import { useTranslation, I18nNamespace } from '@openai/i18n';

export default function ChatEmptyState() {
  const { t } = useTranslation(I18nNamespace.CLIENT);

  return (
    <PageContainer>
      <EmptyState
        title={t('chat.noAgents')}
        message={t('chat.createAgentFirst')}
      />
    </PageContainer>
  );
}
