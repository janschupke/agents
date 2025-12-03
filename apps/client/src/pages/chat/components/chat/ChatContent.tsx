import { Message } from '../../../../types/chat.types';
import ChatMessages from './ChatMessages';
import ChatInput, { ChatInputRef } from './ChatInput';
import ChatPlaceholder from './ChatPlaceholder';

interface ChatContentProps {
  messages: Message[];
  showTypingIndicator: boolean;
  contentLoading?: boolean;
  showPlaceholder: boolean;
  sessionId: number | null;
  input: string;
  inputRef: React.RefObject<ChatInputRef>;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  onInputChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  onShowJson: (title: string, data: unknown) => void;
  onInputRefReady?: (ref: ChatInputRef) => void;
}

/**
 * Main chat content area containing messages and input
 */
export default function ChatContent({
  messages,
  showTypingIndicator,
  contentLoading = false,
  showPlaceholder,
  sessionId,
  input,
  inputRef,
  messagesEndRef,
  onInputChange,
  onSubmit,
  onShowJson,
  onInputRefReady,
}: ChatContentProps) {
  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 relative">
        {contentLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            </div>
          </div>
        ) : showPlaceholder ? (
          <ChatPlaceholder />
        ) : (
          <>
            <ChatMessages
              key={sessionId || 'no-session'}
              messages={messages}
              showTypingIndicator={showTypingIndicator}
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
          disabled={showTypingIndicator}
          onRefReady={onInputRefReady}
        />
      )}
    </div>
  );
}
