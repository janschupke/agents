import {
  Sidebar,
  Container,
  PageHeader,
  PageContent,
  Skeleton,
  SkeletonList,
  SkeletonMessage,
} from '@openai/ui';
import { useTranslation, I18nNamespace } from '@openai/i18n';

export default function ChatLoadingState() {
  const { t } = useTranslation(I18nNamespace.CLIENT);

  return (
    <>
      <Sidebar>
        <div className="p-3">
          <Skeleton className="h-6 w-20 mb-3" />
          <SkeletonList count={5} />
        </div>
      </Sidebar>
      <Container>
        <PageHeader title={t('chat.title')} />
        <PageContent>
          <Skeleton className="h-6 w-32 mb-4" />
          <div className="space-y-4">
            <SkeletonMessage />
            <SkeletonMessage />
            <SkeletonMessage />
          </div>
        </PageContent>
      </Container>
    </>
  );
}
