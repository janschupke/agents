import { PageHeader, PageContent, EmptyState } from '@openai/ui';
import { useTranslation, I18nNamespace } from '@openai/i18n';
import { ROUTES } from '../../../../../../constants/routes.constants';
import { Link } from 'react-router-dom';

interface AgentConfigErrorStateProps {
  message: string;
}

export default function AgentConfigErrorState({
  message,
}: AgentConfigErrorStateProps) {
  const { t } = useTranslation(I18nNamespace.CLIENT);

  return (
    <>
      <PageHeader title={t('config.title')} />
      <PageContent>
        <div className="flex flex-col items-center justify-center h-full">
          <EmptyState
            title={message}
            message={
              <div className="flex flex-col items-center gap-2">
                <span>{t('config.errors.agentNotFound')}</span>
                <Link
                  to={ROUTES.CONFIG}
                  className="text-primary hover:underline"
                >
                  {t('config.selectAgent')}
                </Link>
              </div>
            }
          />
        </div>
      </PageContent>
    </>
  );
}
