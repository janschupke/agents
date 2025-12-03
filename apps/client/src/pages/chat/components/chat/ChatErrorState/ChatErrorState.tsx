import { Container, PageHeader, PageContent, EmptyState } from '@openai/ui';
import { useTranslation, I18nNamespace } from '@openai/i18n';
import { ROUTES } from '../../../../../constants/routes.constants';
import { Link } from 'react-router-dom';

interface ChatErrorStateProps {
  message: string;
}

export default function ChatErrorState({ message }: ChatErrorStateProps) {
  const { t } = useTranslation(I18nNamespace.CLIENT);

  return (
    <Container>
      <PageHeader title={t('chat.title')} />
      <PageContent>
        <div className="flex flex-col items-center justify-center h-full">
          <EmptyState
            title={message}
            message={
              <div className="flex flex-col items-center gap-2">
                <span>{t('chat.errors.sessionNotFound')}</span>
                <Link to={ROUTES.CHAT} className="text-primary hover:underline">
                  {t('chat.selectSession')}
                </Link>
              </div>
            }
          />
        </div>
      </PageContent>
    </Container>
  );
}
