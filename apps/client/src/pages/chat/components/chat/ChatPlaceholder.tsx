import { IconChat } from '../../../../components/ui/Icons';
import { useTranslation, I18nNamespace } from '@openai/i18n';

export default function ChatPlaceholder() {
  const { t } = useTranslation(I18nNamespace.CLIENT);

  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <IconChat className="w-24 h-24 text-text-tertiary mb-4 mx-auto" />
        <p className="text-text-secondary mb-2">{t('chat.selectSession')}</p>
        <p className="text-sm text-text-tertiary">{t('chat.chooseSession')}</p>
      </div>
    </div>
  );
}
