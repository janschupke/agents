import { Session } from '../../types/chat.types.js';

interface SessionItemProps {
  session: Session;
  isSelected: boolean;
  onSelect: (sessionId: number) => void;
}

export default function SessionItem({ session, isSelected, onSelect }: SessionItemProps) {
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
    <button
      onClick={() => onSelect(session.id)}
      className={`px-3 py-2 text-left border-b border-border transition-colors ${
        isSelected
          ? 'bg-primary text-text-inverse'
          : 'bg-background-secondary text-text-primary hover:bg-background'
      }`}
    >
      <div className="text-sm font-medium truncate">
        {formatSessionName(session)}
      </div>
      <div
        className={`text-xs mt-0.5 ${
          isSelected
            ? 'text-text-inverse opacity-80'
            : 'text-text-tertiary'
        }`}
      >
        {new Date(session.createdAt).toLocaleDateString()}
      </div>
    </button>
  );
}
