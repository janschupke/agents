import { Session } from '../../types/chat.types.js';
import { IconPlus } from '../ui/Icons';
import { SkeletonList } from '../ui/Skeleton';
import SessionItem from './SessionItem';

interface SessionSidebarProps {
  sessions: Session[];
  currentSessionId: number | null;
  onSessionSelect: (sessionId: number) => void;
  onNewSession: () => void;
  loading?: boolean;
}

export default function SessionSidebar({
  sessions,
  currentSessionId,
  onSessionSelect,
  onNewSession,
  loading = false,
}: SessionSidebarProps) {
  return (
    <div className="flex flex-col w-56 h-full bg-background-tertiary border-r border-border overflow-hidden">
      <div className="px-3 py-2.5 bg-background border-b border-border">
        <h3 className="text-sm font-semibold text-text-secondary">Sessions</h3>
      </div>
      <div className="flex-1 overflow-y-auto">
        {loading && sessions.length === 0 ? (
          <div className="p-3">
            <SkeletonList count={5} />
          </div>
        ) : sessions.length === 0 ? (
          <div className="p-4 text-text-tertiary text-center text-sm">
            <p className="mb-1">No sessions yet</p>
            <p className="text-xs">Create a new session to start chatting</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {sessions.map((session) => (
              <SessionItem
                key={session.id}
                session={session}
                isSelected={currentSessionId === session.id}
                onSelect={onSessionSelect}
              />
            ))}
          </div>
        )}
      </div>
      <div className="p-2.5 border-t border-border">
        <button
          onClick={onNewSession}
          disabled={loading}
          className="w-full h-8 px-3 bg-primary text-text-inverse border-none rounded-md text-sm font-medium cursor-pointer transition-colors hover:bg-primary-hover disabled:bg-disabled disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
        >
          <IconPlus className="w-4 h-4" />
          <span>New Session</span>
        </button>
      </div>
    </div>
  );
}
