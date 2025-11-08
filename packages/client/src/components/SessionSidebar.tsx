import { Session } from '../types/chat.types.js';
import { IconPlus } from './Icons';
import { SkeletonList } from './Skeleton';

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
  const formatSessionName = (session: Session): string => {
    if (session.session_name) {
      return session.session_name;
    }
    const date = new Date(session.createdAt);
    return `Session ${date.toLocaleDateString()} ${date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  };

  return (
    <div className="flex flex-col w-56 h-full bg-background-secondary border-r border-border overflow-hidden">
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
            No sessions yet
          </div>
        ) : (
          <div className="flex flex-col">
            {sessions.map((session) => (
              <button
                key={session.id}
                onClick={() => onSessionSelect(session.id)}
                className={`px-3 py-2 text-left border-b border-border transition-colors ${
                  currentSessionId === session.id
                    ? 'bg-primary text-text-inverse'
                    : 'bg-background-secondary text-text-primary hover:bg-background'
                }`}
              >
                <div className="text-sm font-medium truncate">
                  {formatSessionName(session)}
                </div>
                <div
                  className={`text-xs mt-0.5 ${
                    currentSessionId === session.id
                      ? 'text-text-inverse opacity-80'
                      : 'text-text-tertiary'
                  }`}
                >
                  {new Date(session.createdAt).toLocaleDateString()}
                </div>
              </button>
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
