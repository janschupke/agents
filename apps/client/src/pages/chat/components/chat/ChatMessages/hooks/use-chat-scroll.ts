import { useEffect, useRef, useCallback } from 'react';

interface UseChatScrollOptions {
  messages: unknown[];
  sessionId: number | null;
  showTypingIndicator?: boolean;
  messagesContainerRef?: React.RefObject<HTMLDivElement>;
}

interface UseChatScrollReturn {
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

/**
 * Hook to manage auto-scrolling to bottom of chat
 * Extracted from ChatAgent component
 * Uses ResizeObserver to detect content height changes and multiple scroll attempts
 * to ensure full content is visible after markdown rendering
 */
export function useChatScroll({
  messages,
  sessionId,
  showTypingIndicator = false,
  messagesContainerRef,
}: UseChatScrollOptions): UseChatScrollReturn {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isInitialLoadRef = useRef(true);
  const previousMessageCountRef = useRef(0);
  const previousTypingIndicatorRef = useRef(false);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const mutationObserverRef = useRef<MutationObserver | null>(null);
  const scrollTimeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const shouldAutoScrollRef = useRef(true);

  /**
   * Scroll to bottom using the most reliable method available
   */
  const scrollToBottom = useCallback(
    (behavior: ScrollBehavior = 'smooth') => {
      const container = messagesContainerRef?.current;
      const endElement = messagesEndRef.current;

      if (container) {
        // Use container's scrollTo for more reliable scrolling
        // Use a small offset to ensure we're truly at the bottom
        const targetScroll = container.scrollHeight;
        container.scrollTo({
          top: targetScroll,
          behavior,
        });
        // Also set scrollTop directly as a fallback (for instant scroll)
        if (behavior === 'auto') {
          container.scrollTop = targetScroll;
        }
      } else if (endElement) {
        // Fallback to scrollIntoView
        endElement.scrollIntoView({ behavior });
      }
    },
    [messagesContainerRef]
  );

  /**
   * Schedule multiple scroll attempts with increasing delays
   * This handles cases where content is still rendering/expanding
   */
  const scheduleScrollAttempts = useCallback(
    (behavior: ScrollBehavior = 'smooth') => {
      // Clear any existing timeouts
      scrollTimeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
      scrollTimeoutsRef.current = [];

      // Immediate scroll
      requestAnimationFrame(() => {
        scrollToBottom(behavior);
      });

      // Additional attempts with increasing delays to catch late-rendering content
      // Longer delays to account for markdown rendering, image loading, etc.
      const delays = [150, 300, 600, 1000];
      delays.forEach((delay) => {
        const timeout = setTimeout(() => {
          scrollToBottom(behavior);
        }, delay);
        scrollTimeoutsRef.current.push(timeout);
      });
    },
    [scrollToBottom]
  );

  // Scroll to bottom when messages change
  useEffect(() => {
    const messageCount = messages.length;
    const isNewMessage = messageCount > previousMessageCountRef.current;

    if (messageCount === 0) {
      previousMessageCountRef.current = messageCount;
      return;
    }

    if (isInitialLoadRef.current) {
      // Initial load: use instant scroll
      shouldAutoScrollRef.current = true;
      requestAnimationFrame(() => {
        scrollToBottom('auto');
      });
      isInitialLoadRef.current = false;
    } else if (isNewMessage) {
      // New message: use multiple scroll attempts to catch expanding content
      shouldAutoScrollRef.current = true;
      scheduleScrollAttempts('smooth');
      // Reset flag after delays complete
      setTimeout(() => {
        shouldAutoScrollRef.current = false;
      }, 1500);
    }

    previousMessageCountRef.current = messageCount;
  }, [messages, scheduleScrollAttempts, scrollToBottom]);

  // Use ResizeObserver and MutationObserver to detect content changes and scroll accordingly
  useEffect(() => {
    const container = messagesContainerRef?.current;
    const endElement = messagesEndRef.current;

    if (!container || !endElement) {
      return;
    }

    // Function to handle scroll when content changes
    const handleContentChange = () => {
      if (!shouldAutoScrollRef.current) {
        // Check if user is near bottom (within 150px)
        const isNearBottom =
          container.scrollHeight -
            container.scrollTop -
            container.clientHeight <
          150;
        if (!isNearBottom) {
          return; // User scrolled up, don't auto-scroll
        }
      }

      // Scroll to bottom when content changes
      requestAnimationFrame(() => {
        scrollToBottom('smooth');
      });
    };

    // Create ResizeObserver to watch for content size changes
    resizeObserverRef.current = new ResizeObserver(handleContentChange);

    // Create MutationObserver to watch for DOM changes (markdown rendering, etc.)
    mutationObserverRef.current = new MutationObserver(() => {
      // Debounce mutations to avoid excessive scrolling
      requestAnimationFrame(() => {
        handleContentChange();
      });
    });

    // Observe the container for size changes
    resizeObserverRef.current.observe(container);
    // Also observe the end element
    resizeObserverRef.current.observe(endElement);

    // Observe the container for DOM mutations (childList, subtree changes)
    mutationObserverRef.current.observe(container, {
      childList: true,
      subtree: true,
      attributes: false,
      characterData: true,
    });

    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
      if (mutationObserverRef.current) {
        mutationObserverRef.current.disconnect();
      }
      scrollTimeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
      scrollTimeoutsRef.current = [];
    };
  }, [messagesContainerRef, messages.length, scrollToBottom]);

  // Scroll to bottom when typing indicator appears
  useEffect(() => {
    if (
      showTypingIndicator &&
      !previousTypingIndicatorRef.current &&
      messagesEndRef.current
    ) {
      // Typing indicator just appeared, scroll to show it
      scheduleScrollAttempts('smooth');
    }
    previousTypingIndicatorRef.current = showTypingIndicator;
  }, [showTypingIndicator, scheduleScrollAttempts]);

  // Reset initial load flag when session changes
  useEffect(() => {
    isInitialLoadRef.current = true;
    previousMessageCountRef.current = 0;
  }, [sessionId]);

  return { messagesEndRef };
}
