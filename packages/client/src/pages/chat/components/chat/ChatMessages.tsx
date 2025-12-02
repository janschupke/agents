import { Message, MessageRole } from '../../../types/chat.types';
import MessageBubble from './MessageBubble';
import { Skeleton } from '../../../../components/ui/feedback';
import { IconChat } from '../../../../components/ui/Icons';
import { FadeIn } from '../../../../components/ui/animation';
import { useRef, useEffect } from 'react';

interface ChatMessagesProps {
  messages: Message[];
  loading?: boolean;
  onShowJson: (title: string, data: unknown) => void;
  sessionId?: number | null;
}

export default function ChatMessages({ messages, loading, onShowJson, sessionId }: ChatMessagesProps) {
  const filteredMessages = messages.filter((msg) => msg.role !== MessageRole.SYSTEM);
  const initialMessageCountRef = useRef<number | null>(null);
  const lastSessionIdRef = useRef<number | null | undefined>(undefined);
  
  // Reset and track initial message count when session changes or on first render
  useEffect(() => {
    if (sessionId !== lastSessionIdRef.current) {
      // Session changed, reset initial count
      initialMessageCountRef.current = null;
      lastSessionIdRef.current = sessionId;
    }
    
    if (initialMessageCountRef.current === null && filteredMessages.length > 0) {
      initialMessageCountRef.current = filteredMessages.length;
    }
  }, [filteredMessages.length, sessionId]);
  
  // Determine if a message is new (added after initial load)
  const isNewMessage = (index: number) => {
    if (initialMessageCountRef.current === null) return false;
    return index >= initialMessageCountRef.current;
  };

  // Show empty state with chat bubble icon if no messages
  if (filteredMessages.length === 0 && !loading) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <IconChat className="w-24 h-24 text-text-tertiary mb-4 mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <>
      {filteredMessages.map((message, index) => {
        const isNew = isNewMessage(index);
        const messageKey = message.id || index;
        const positioningClasses = `flex flex-col max-w-[80%] ${message.role === MessageRole.USER ? 'self-end' : 'self-start'}`;
        
        // Only animate new messages
        return isNew ? (
          <FadeIn key={messageKey} className={positioningClasses}>
            <MessageBubble
              message={message}
              messageId={message.id}
              onShowJson={onShowJson}
            />
          </FadeIn>
        ) : (
          <div key={messageKey} className={positioningClasses}>
            <MessageBubble
              message={message}
              messageId={message.id}
              onShowJson={onShowJson}
            />
          </div>
        );
      })}
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
