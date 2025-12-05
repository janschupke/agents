import { useTranslation, I18nNamespace } from '@openai/i18n';

interface LoadingStateProps {
  message?: string;
  className?: string;
}

export default function LoadingState({
  message,
  className = '',
}: LoadingStateProps) {
  const { t } = useTranslation(I18nNamespace.ADMIN);

  return (
    <div className={`flex items-center justify-center p-8 ${className}`}>
      <div className="text-text-secondary">{message || t('app.loading')}</div>
    </div>
  );
}
