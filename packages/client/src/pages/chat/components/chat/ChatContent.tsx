import { Message } from '../../../../types/chat.types';
import ChatMessages from './ChatMessages';
import ChatInput, { ChatInputRef } from './ChatInput';
import ChatPlaceholder from './ChatPlaceholder';

interface ChatContentProps {
  messages: Message[];
  loading: boolean;
  showPlaceholder: boolean;
  sessionId: number | null;
  input: string;
  inputRef: React.RefObject<ChatInputRef>;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  onInputChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  onShowJson: (title: string, data: unknown) => void;
}

/**
 * Main chat content area containing messages and input
 */
export default function ChatContent({
  messages,
  loading,
  showPlaceholder,
  sessionId,
  input,
  inputRef,
  messagesEndRef,
  onInputChange,
  onSubmit,
  onShowJson,
}: ChatContentProps) {
  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 relative">
        {showPlaceholder && !loading ? (
          <ChatPlaceholder />
        ) : (
          <>
            <ChatMessages
              key={sessionId || 'no-session'}
              messages={messages}
              loading={loading && messages.length === 0}
              onShowJson={onShowJson}
              sessionId={sessionId}
            />
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
      {!showPlaceholder && (
        <ChatInput
          ref={inputRef}
          input={input}
          onInputChange={onInputChange}
          onSubmit={onSubmit}
          disabled={loading}
        />
      )}
    </div>
  );
}
