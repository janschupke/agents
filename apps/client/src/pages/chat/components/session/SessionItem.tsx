import { Session } from '../../../../types/chat.types';
import { IconTrash, IconPencil } from '../../../../components/ui/Icons';
import { formatDate, formatTime } from '@openai/utils';
import { useTranslation, I18nNamespace } from '@openai/i18n';

interface SessionItemProps {
  session: Session;
  isSelected: boolean;
  onSelect: (sessionId: number) => void;
  onDelete?: (sessionId: number) => void;
  onEdit?: (sessionId: number) => void;
}

export default function SessionItem({
  session,
  isSelected,
  onSelect,
  onDelete,
  onEdit,
}: SessionItemProps) {
  const { t } = useTranslation(I18nNamespace.CLIENT);

  const formatSessionName = (session: Session): string => {
    if (session.session_name) {
      return session.session_name;
    }
    return `${t('chat.session')} ${formatDate(session.createdAt)} ${formatTime(session.createdAt)}`;
  };

  return (
    <div
      className={`group flex items-center border-b border-border transition-colors ${
        isSelected
          ? 'bg-primary text-text-inverse'
          : 'bg-background text-text-primary hover:bg-background-tertiary'
      }`}
    >
      <button
        onClick={() => onSelect(session.id)}
        className={`flex-1 px-3 py-2 text-left transition-colors min-w-0 bg-transparent ${
          isSelected ? 'text-text-inverse' : ''
        }`}
      >
        <div className="text-sm font-medium truncate">
          {formatSessionName(session)}
        </div>
        <div
          className={`text-xs mt-0.5 ${
            isSelected ? 'text-text-inverse opacity-80' : 'text-text-tertiary'
          }`}
        >
          {formatDate(session.createdAt)}
        </div>
      </button>
      <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
        {onEdit && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(session.id);
            }}
            className={`px-2 py-1 transition-colors bg-transparent ${
              isSelected
                ? 'text-text-inverse hover:opacity-80'
                : 'text-text-tertiary hover:text-text-primary'
            }`}
            title={t('chat.editSessionNameTooltip')}
          >
            <IconPencil className="w-4 h-4" />
          </button>
        )}
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(session.id);
            }}
            className={`px-2 py-1 transition-colors bg-transparent ${
              isSelected
                ? 'text-text-inverse hover:opacity-100'
                : 'text-text-tertiary hover:text-red-500'
            }`}
            title={t('chat.deleteSessionTooltip')}
          >
            <IconTrash className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
