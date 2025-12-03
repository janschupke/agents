import { Session } from '../../../../../types/chat.types';
import {
  IconPlus,
  SkeletonList,
  Sidebar,
  SidebarHeader,
  SidebarContent,
} from '@openai/ui';
import { useTranslation, I18nNamespace } from '@openai/i18n';
import SessionItem from '../SessionItem/SessionItem';

interface SessionSidebarProps {
  sessions: Session[];
  agentId: number | null;
  currentSessionId: number | null;
  onSessionSelect: (sessionId: number) => void;
  onNewSession: () => void;
  onSessionDelete?: (sessionId: number) => void;
  onSessionEdit?: (sessionId: number) => void;
  loading?: boolean;
}

export default function SessionSidebar({
  sessions,
  agentId,
  currentSessionId,
  onSessionSelect,
  onNewSession,
  onSessionDelete,
  onSessionEdit,
  loading = false,
}: SessionSidebarProps) {
  const { t } = useTranslation(I18nNamespace.CLIENT);

  return (
    <Sidebar>
      <SidebarHeader
        title={t('chat.sessions')}
        action={{
          icon: <IconPlus size="md" />,
          onClick: onNewSession,
          disabled: loading,
          tooltip: t('chat.newSession'),
        }}
      />
      <SidebarContent
        loading={loading}
        empty={sessions.length === 0}
        loadingComponent={
          <div className="p-3">
            <SkeletonList count={5} />
          </div>
        }
        emptyMessage={
          <>
            <p className="mb-1">{t('chat.noSessions')}</p>
            <p className="text-xs">{t('chat.createNewSession')}</p>
          </>
        }
      >
        <div className="flex flex-col">
          {sessions.map((session) => (
            <SessionItem
              key={session.id}
              session={session}
              agentId={agentId}
              isSelected={currentSessionId === session.id}
              onSelect={onSessionSelect}
              onDelete={onSessionDelete}
              onEdit={onSessionEdit}
            />
          ))}
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
