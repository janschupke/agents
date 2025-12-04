import { useEffect, useRef } from 'react';

interface UseChatScrollOptions {
  messages: unknown[];
  sessionId: number | null;
  showTypingIndicator?: boolean;
}

interface UseChatScrollReturn {
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

/**
 * Hook to manage auto-scrolling to bottom of chat
 * Extracted from ChatAgent component
 */
export function useChatScroll({
  messages,
  sessionId,
  showTypingIndicator = false,
}: UseChatScrollOptions): UseChatScrollReturn {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isInitialLoadRef = useRef(true);
  const previousMessageCountRef = useRef(0);
  const previousTypingIndicatorRef = useRef(false);

  // Scroll to bottom when messages change
  useEffect(() => {
    const messageCount = messages.length;
    const isNewMessage = messageCount > previousMessageCountRef.current;

    if (messageCount === 0) {
      previousMessageCountRef.current = messageCount;
      return;
    }

    // Use requestAnimationFrame + setTimeout to ensure DOM is fully rendered
    requestAnimationFrame(() => {
      setTimeout(() => {
        if (isInitialLoadRef.current && messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
          isInitialLoadRef.current = false;
        } else if (isNewMessage && messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }, 50);
    });

    previousMessageCountRef.current = messageCount;
  }, [messages]);

  // Scroll to bottom when typing indicator appears
  useEffect(() => {
    if (
      showTypingIndicator &&
      !previousTypingIndicatorRef.current &&
      messagesEndRef.current
    ) {
      // Typing indicator just appeared, scroll to show it
      requestAnimationFrame(() => {
        setTimeout(() => {
          if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
          }
        }, 50);
      });
    }
    previousTypingIndicatorRef.current = showTypingIndicator;
  }, [showTypingIndicator]);

  // Reset initial load flag when session changes
  useEffect(() => {
    isInitialLoadRef.current = true;
    previousMessageCountRef.current = 0;
  }, [sessionId]);

  return { messagesEndRef };
}
