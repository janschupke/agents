import { useState, useEffect, useMemo, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Message,
  MessageRole,
  SendMessageResponse,
} from '../../../../../../types/chat.types';
import { SavedWordMatch } from '../../../../../../types/saved-word.types';
import { useChatHistory } from '../../../../../../hooks/queries/use-chat';
import { useSendMessage } from '../../../../../../hooks/mutations/use-chat-mutations';
import { queryKeys } from '../../../../../../hooks/queries/query-keys';

interface UseChatMessagesOptions {
  agentId: number | null;
  sessionId: number | null;
}

interface UseChatMessagesReturn {
  messages: Message[];
  savedWordMatches: Map<string, SavedWordMatch>; // Map of word (lowercase) -> saved word data
  loading: boolean;
  isSendingMessage: boolean;
  sendMessage: (message: string) => Promise<SendMessageResponse | undefined>;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  messagesContainerRef: React.RefObject<HTMLDivElement>;
  isFetchingMore: boolean;
  hasNextPage: boolean;
  fetchNextPage: () => void;
}

/**
 * Hook to manage chat messages state and operations with infinite scroll pagination
 * Extracted from ChatAgent component
 */
export function useChatMessages({
  agentId,
  sessionId,
}: UseChatMessagesOptions): UseChatMessagesReturn {
  const queryClient = useQueryClient();
  const {
    data,
    isLoading: loadingChatHistory,
    isFetching: fetchingChatHistory,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useChatHistory(agentId, sessionId);
  const sendMessageMutation = useSendMessage();
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Combine all pages into single messages array
  // Messages come in reverse chronological order (newest first), reverse for display
  const messages = useMemo(() => {
    if (!data?.pages) return [];

    // Each page has messages in chronological order (oldest first)
    // We need to combine all pages, with oldest page first
    const allMessages: Message[] = [];
    // Process pages in order (oldest page first)
    for (const page of data.pages) {
      allMessages.push(...page.messages);
    }
    return allMessages;
  }, [data]);

  // Get saved word matches from the first page (they're the same across all pages)
  const savedWordMatches = useMemo(() => {
    const firstPage = data?.pages?.[0];
    if (!firstPage?.savedWordMatches) {
      return new Map<string, SavedWordMatch>();
    }

    const map = new Map<string, SavedWordMatch>();
    for (const match of firstPage.savedWordMatches) {
      const lowerKey = match.originalWord.toLowerCase();
      // Only add if not already in map (first match wins)
      if (!map.has(lowerKey)) {
        map.set(lowerKey, match);
      }
    }
    return map;
  }, [data?.pages?.[0]?.savedWordMatches]);

  // Detect scroll to top and load more
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container || !hasNextPage || isFetchingNextPage) return;

    const handleScroll = () => {
      // Load more when scrolled to top (or near top)
      if (container.scrollTop < 100) {
        fetchNextPage();
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Clear messages when session or agent changes (handled by query key change)
  // No need for separate useEffect since React Query handles this

  const sendMessage = async (message: string) => {
    if (!message.trim() || !agentId) return;

    try {
      const result = await sendMessageMutation.mutateAsync({
        agentId,
        message,
        sessionId: sessionId || undefined,
      });

      // Invalidate and refetch chat history to get updated messages
      // This ensures new messages appear in the infinite query
      const queryKey = queryKeys.chat.history(agentId, sessionId || undefined);
      await queryClient.invalidateQueries({ queryKey });

      // Update saved word matches if new matches were returned
      if (result.savedWordMatches && result.savedWordMatches.length > 0) {
        // Update the chat history query cache with new saved word matches
        queryClient.setQueryData(queryKey, (oldData: any) => {
          if (!oldData?.pages) return oldData;
          const firstPage = oldData.pages[0];
          if (!firstPage) return oldData;

          const existingMatches = firstPage.savedWordMatches || [];
          const newMatches = result.savedWordMatches || [];

          // Merge matches, avoiding duplicates
          const matchMap = new Map<string, any>();
          [...existingMatches, ...newMatches].forEach((match) => {
            const key = match.originalWord.toLowerCase();
            if (!matchMap.has(key)) {
              matchMap.set(key, match);
            }
          });

          return {
            ...oldData,
            pages: [
              {
                ...firstPage,
                savedWordMatches: Array.from(matchMap.values()),
              },
              ...oldData.pages.slice(1),
            ],
          };
        });
      }

      return result;
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  };

  // Only show loading if:
  // 1. We're loading/fetching AND (we have no messages yet OR the history matches current session)
  // This prevents showing loading state for stale/previous sessions when rapidly switching
  const isInitialLoad = messages.length === 0;
  const firstPage = data?.pages?.[0];
  const isLoadingForCurrentSession =
    (loadingChatHistory || fetchingChatHistory) &&
    (isInitialLoad || firstPage?.session?.id === sessionId);
  const loading = isLoadingForCurrentSession;

  // Separate isSendingMessage from loading to distinguish between initial load and message sending
  const isSendingMessage = sendMessageMutation.isPending;

  return {
    messages,
    savedWordMatches,
    loading,
    isSendingMessage,
    sendMessage,
    setMessages: () => {}, // No-op since we use infinite query data directly
    messagesContainerRef,
    isFetchingMore: isFetchingNextPage,
    hasNextPage: hasNextPage ?? false,
    fetchNextPage,
  };
}
