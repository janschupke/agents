import { Message } from '../../types/chat.types.js';
import MessageBubble from './MessageBubble';
import { Skeleton } from '../ui/Skeleton';

interface ChatMessagesProps {
  messages: Message[];
  loading?: boolean;
  onShowJson: (title: string, data: unknown) => void;
}

export default function ChatMessages({ messages, loading, onShowJson }: ChatMessagesProps) {
  const filteredMessages = messages.filter((msg) => msg.role !== 'system');

  return (
    <>
      {filteredMessages.map((message, index) => (
        <MessageBubble key={index} message={message} onShowJson={onShowJson} />
      ))}
      {loading && (
        <div className="flex max-w-[80%] self-start">
          <div className="px-3 py-2 rounded-lg bg-message-assistant text-message-assistant-text text-sm">
            <div className="flex items-center gap-2">
              <Skeleton className="w-2 h-2 rounded-full" />
              <Skeleton className="w-2 h-2 rounded-full" />
              <Skeleton className="w-2 h-2 rounded-full" />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
