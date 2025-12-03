import {
  Sidebar,
  Container,
  PageHeader,
  PageContent,
  Skeleton,
} from '@openai/ui';
import { useTranslation, I18nNamespace } from '@openai/i18n';

export default function AgentConfigLoadingState() {
  const { t } = useTranslation(I18nNamespace.CLIENT);

  return (
    <>
      <Sidebar>
        <div className="p-3">
          <Skeleton className="h-6 w-20 mb-3" />
        </div>
      </Sidebar>
      <Container>
        <PageHeader title={t('config.title')} />
        <PageContent>
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4 mb-4" />
        </PageContent>
      </Container>
    </>
  );
}
