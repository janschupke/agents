import { useEffect, useRef } from 'react';

interface UseChatScrollOptions {
  messages: unknown[];
  sessionId: number | null;
}

interface UseChatScrollReturn {
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

/**
 * Hook to manage auto-scrolling to bottom of chat
 * Extracted from ChatAgent component
 */
export function useChatScroll({ messages, sessionId }: UseChatScrollOptions): UseChatScrollReturn {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isInitialLoadRef = useRef(true);
  const previousMessageCountRef = useRef(0);

  // Scroll to bottom when messages change
  useEffect(() => {
    const messageCount = messages.length;
    const isNewMessage = messageCount > previousMessageCountRef.current;
    
    if (isInitialLoadRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
      isInitialLoadRef.current = false;
    } else if (isNewMessage) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    
    previousMessageCountRef.current = messageCount;
  }, [messages]);
  
  // Reset initial load flag when session changes
  useEffect(() => {
    isInitialLoadRef.current = true;
    previousMessageCountRef.current = 0;
  }, [sessionId]);

  return { messagesEndRef };
}
