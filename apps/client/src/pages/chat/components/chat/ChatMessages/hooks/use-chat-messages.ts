import { useMemo, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Message,
  MessageRole,
  SendMessageResponse,
  ChatHistoryResponse,
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
  sessionId: number | null; // Added sessionId from query data
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
    data: chatHistory,
    isLoading: loadingChatHistory,
    isFetching: fetchingChatHistory,
  } = useChatHistory(agentId, sessionId);
  const sendMessageMutation = useSendMessage();
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Messages are already in chronological order from backend
  const messages = useMemo(() => {
    return chatHistory?.messages || [];
  }, [chatHistory?.messages]);

  // Get saved word matches
  const savedWordMatches = useMemo(() => {
    if (!chatHistory?.savedWordMatches) {
      return new Map<string, SavedWordMatch>();
    }

    const map = new Map<string, SavedWordMatch>();
    for (const match of chatHistory.savedWordMatches) {
      const lowerKey = match.originalWord.toLowerCase();
      // Only add if not already in map (first match wins)
      if (!map.has(lowerKey)) {
        map.set(lowerKey, match);
      }
    }
    return map;
  }, [chatHistory?.savedWordMatches]);

  // Clear messages when session or agent changes (handled by query key change)
  // No need for separate useEffect since React Query handles this

  const sendMessage = async (message: string) => {
    if (!message.trim() || !agentId) return;

    const queryKey = queryKeys.chat.history(agentId, sessionId || undefined);

    // Optimistically add user message to cache immediately
    const optimisticUserMessage: Message = {
      role: MessageRole.USER,
      content: message.trim(),
      rawRequest: undefined,
    };

    queryClient.setQueryData(
      queryKey,
      (oldData: ChatHistoryResponse | undefined) => {
        if (!oldData) {
          // If no data yet, create minimal structure
          return {
            agent: { id: agentId, name: '', description: null },
            session: sessionId ? { id: sessionId, session_name: null } : null,
            messages: [optimisticUserMessage],
            savedWordMatches: [],
            hasMore: false,
          };
        }

        return {
          ...oldData,
          messages: [...oldData.messages, optimisticUserMessage],
        };
      }
    );

    try {
      const result = await sendMessageMutation.mutateAsync({
        agentId,
        message,
        sessionId: sessionId || undefined,
      });

      // Invalidate and refetch chat history to get updated messages with IDs
      await queryClient.invalidateQueries({ queryKey });

      // Update saved word matches if new matches were returned
      if (result.savedWordMatches && result.savedWordMatches.length > 0) {
        // Update the chat history query cache with new saved word matches
        queryClient.setQueryData(
          queryKey,
          (oldData: ChatHistoryResponse | undefined) => {
            if (!oldData) return oldData;

            const existingMatches = oldData.savedWordMatches || [];
            const newMatches = result.savedWordMatches || [];

            // Merge matches, avoiding duplicates
            const matchMap = new Map<string, SavedWordMatch>();
            [...existingMatches, ...newMatches].forEach((match) => {
              const key = match.originalWord.toLowerCase();
              if (!matchMap.has(key)) {
                matchMap.set(key, match);
              }
            });

            return {
              ...oldData,
              savedWordMatches: Array.from(matchMap.values()),
            };
          }
        );
      }

      return result;
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  };

  // Only show loading if we're loading and have no messages yet
  const isInitialLoad = messages.length === 0;
  const isLoadingForCurrentSession =
    (loadingChatHistory || fetchingChatHistory) && isInitialLoad;
  const loading = isLoadingForCurrentSession;

  // Separate isSendingMessage from loading to distinguish between initial load and message sending
  const isSendingMessage = sendMessageMutation.isPending;

  // Get sessionId from query data
  const sessionIdFromData = chatHistory?.session?.id ?? null;

  return {
    messages,
    savedWordMatches,
    loading,
    isSendingMessage,
    sendMessage,
    setMessages: () => {}, // No-op since we use query data directly
    messagesContainerRef,
    isFetchingMore: false, // No pagination
    hasNextPage: false, // No pagination
    fetchNextPage: () => Promise.resolve(), // No-op
    sessionId: sessionIdFromData, // Return sessionId from query data
  };
}
