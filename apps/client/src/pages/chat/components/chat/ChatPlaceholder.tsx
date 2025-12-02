import { IconChat, EmptyState } from '@openai/ui';
import { useTranslation, I18nNamespace } from '@openai/i18n';

export default function ChatPlaceholder() {
  const { t } = useTranslation(I18nNamespace.CLIENT);

  return (
    <EmptyState
      icon={<IconChat className="w-24 h-24 text-text-tertiary mx-auto" />}
      title={t('chat.selectSession')}
      message={t('chat.chooseSession')}
    />
  );
}
