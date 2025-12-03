import { Session } from '../../../../types/chat.types';
import { IconTrash, IconPencil, SidebarItem } from '@openai/ui';
import { formatDate, formatTime } from '@openai/utils';
import { useTranslation, I18nNamespace } from '@openai/i18n';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../../../hooks/queries/query-keys';
import { MessageService } from '../../../../services/chat/message/message.service';

interface SessionItemProps {
  session: Session;
  agentId: number | null;
  isSelected: boolean;
  onSelect: (sessionId: number) => void;
  onDelete?: (sessionId: number) => void;
  onEdit?: (sessionId: number) => void;
}

export default function SessionItem({
  session,
  agentId,
  isSelected,
  onSelect,
  onDelete,
  onEdit,
}: SessionItemProps) {
  const { t } = useTranslation(I18nNamespace.CLIENT);
  const queryClient = useQueryClient();

  const formatSessionName = (session: Session): string => {
    if (session.session_name) {
      return session.session_name;
    }
    return `${t('chat.session')} ${formatDate(session.createdAt)} ${formatTime(session.createdAt)}`;
  };

  const actions = [];
  if (onEdit) {
    actions.push({
      icon: <IconPencil className="w-4 h-4" />,
      onClick: () => onEdit(session.id),
      variant: 'default' as const,
      tooltip: t('chat.editSessionNameTooltip'),
    });
  }
  if (onDelete) {
    actions.push({
      icon: <IconTrash className="w-4 h-4" />,
      onClick: () => onDelete(session.id),
      variant: 'danger' as const,
      tooltip: t('chat.deleteSessionTooltip'),
    });
  }

  const handleMouseEnter = () => {
    // Prefetch chat history for this session on hover
    if (agentId) {
      queryClient.prefetchQuery({
        queryKey: queryKeys.chat.history(agentId, session.id),
        queryFn: () => MessageService.getChatHistory(agentId, session.id),
      });
    }
  };

  return (
    <SidebarItem
      isSelected={isSelected}
      title={formatSessionName(session)}
      description={formatDate(session.createdAt)}
      onClick={() => onSelect(session.id)}
      onMouseEnter={handleMouseEnter}
      actions={actions.length > 0 ? actions : undefined}
    />
  );
}
