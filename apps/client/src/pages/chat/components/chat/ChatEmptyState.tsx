import { Container, PageHeader, PageContent, EmptyState } from '@openai/ui';
import { useTranslation, I18nNamespace } from '@openai/i18n';

export default function ChatEmptyState() {
  const { t } = useTranslation(I18nNamespace.CLIENT);

  return (
    <Container>
      <PageHeader title={t('chat.title')} />
      <PageContent>
        <div className="flex flex-col items-center justify-center h-full">
          <EmptyState
            title={t('chat.noAgents')}
            message={t('chat.createAgentFirst')}
          />
        </div>
      </PageContent>
    </Container>
  );
}
