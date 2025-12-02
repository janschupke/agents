import { Session } from '../../../../types/chat.types';
import { IconPlus } from '../../../../components/ui/Icons';
import { SkeletonList } from '../../../../components/ui/feedback';
import { useTranslation, I18nNamespace } from '@openai/i18n';
import SessionItem from './SessionItem';

interface SessionSidebarProps {
  sessions: Session[];
  currentSessionId: number | null;
  onSessionSelect: (sessionId: number) => void;
  onNewSession: () => void;
  onSessionDelete?: (sessionId: number) => void;
  onSessionEdit?: (sessionId: number) => void;
  loading?: boolean;
}

export default function SessionSidebar({
  sessions,
  currentSessionId,
  onSessionSelect,
  onNewSession,
  onSessionDelete,
  onSessionEdit,
  loading = false,
}: SessionSidebarProps) {
  const { t } = useTranslation(I18nNamespace.CLIENT);

  return (
    <div className="flex flex-col w-56 h-full bg-background-tertiary border-r border-border overflow-hidden">
      <div className="px-3 py-2.5 bg-background border-b border-border flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-secondary">
          {t('chat.sessions')}
        </h3>
        <button
          onClick={onNewSession}
          disabled={loading}
          className="h-6 w-6 flex items-center justify-center text-text-tertiary hover:text-text-primary hover:bg-background-tertiary rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title={t('chat.newSession')}
        >
          <IconPlus className="w-4 h-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {loading && sessions.length === 0 ? (
          <div className="p-3">
            <SkeletonList count={5} />
          </div>
        ) : sessions.length === 0 ? (
          <div className="p-4 text-text-tertiary text-center text-sm">
            <p className="mb-1">{t('chat.noSessions')}</p>
            <p className="text-xs">{t('chat.createNewSession')}</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {sessions.map((session) => (
              <SessionItem
                key={session.id}
                session={session}
                isSelected={currentSessionId === session.id}
                onSelect={onSessionSelect}
                onDelete={onSessionDelete}
                onEdit={onSessionEdit}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
