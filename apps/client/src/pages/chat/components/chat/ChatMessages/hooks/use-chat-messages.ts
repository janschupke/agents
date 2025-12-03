import { useState, useEffect } from 'react';
import {
  Message,
  MessageRole,
  SendMessageResponse,
} from '../../../../../../types/chat.types';
import { useChatHistory } from '../../../../../../hooks/queries/use-chat';
import { useSendMessage } from '../../../../../../hooks/mutations/use-chat-mutations';

interface UseChatMessagesOptions {
  agentId: number | null;
  sessionId: number | null;
}

interface UseChatMessagesReturn {
  messages: Message[];
  loading: boolean;
  isSendingMessage: boolean;
  sendMessage: (message: string) => Promise<SendMessageResponse | undefined>;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}

/**
 * Hook to manage chat messages state and operations
 * Extracted from ChatAgent component
 */
export function useChatMessages({
  agentId,
  sessionId,
}: UseChatMessagesOptions): UseChatMessagesReturn {
  const {
    data: chatHistory,
    isLoading: loadingChatHistory,
    isFetching: fetchingChatHistory,
  } = useChatHistory(agentId, sessionId);
  const sendMessageMutation = useSendMessage();
  const [messages, setMessages] = useState<Message[]>([]);

  // Clear messages when session or agent changes
  useEffect(() => {
    setMessages([]);
  }, [sessionId, agentId]);

  // Update messages from chat history
  useEffect(() => {
    if (!chatHistory || !agentId) {
      return;
    }

    if (sessionId) {
      const historySessionId = chatHistory.session?.id;
      // Only update if history matches current session
      if (historySessionId === sessionId && chatHistory.messages) {
        setMessages(chatHistory.messages);
      }
    } else {
      // No sessionId - use messages from history (will be empty if no session exists)
      setMessages(chatHistory.messages || []);
    }
  }, [chatHistory, agentId, sessionId]);

  const sendMessage = async (message: string) => {
    if (!message.trim() || !agentId) return;

    // Optimistically add user message
    const userMessage: Message = {
      role: MessageRole.USER,
      content: message,
    };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const result = await sendMessageMutation.mutateAsync({
        agentId,
        message,
        sessionId: sessionId || undefined,
      });

      // Update messages with assistant response
      const assistantMessage: Message = {
        role: MessageRole.ASSISTANT,
        content: result.response,
        rawResponse: result.rawResponse,
        id: result.assistantMessageId,
      };

      setMessages((prev) => {
        // Update last user message with ID if available
        const updated = [...prev];
        const lastUserIndex = updated.length - 2;
        if (
          lastUserIndex >= 0 &&
          updated[lastUserIndex]?.role === MessageRole.USER
        ) {
          updated[lastUserIndex] = {
            ...updated[lastUserIndex],
            id: result.userMessageId ?? updated[lastUserIndex].id,
            rawRequest: result.rawRequest,
          };
        }
        return [...updated, assistantMessage];
      });

      // Sessions query is already invalidated by useSendMessage mutation
      // This ensures automatic reordering by last message date

      return result;
    } catch (error) {
      // Remove optimistic user message on error
      setMessages((prev) => prev.slice(0, -1));
      console.error('Failed to send message:', error);
      throw error;
    }
  };

  // Only show loading if:
  // 1. We're loading/fetching AND (we have no messages yet OR the history matches current session)
  // This prevents showing loading state for stale/previous sessions when rapidly switching
  // React Query's useChatHistory automatically handles query key changes, so isLoading should
  // only be true for the current session's query. We add an extra check to ensure we don't
  // show loading if we have messages from a different session.
  const isInitialLoad = messages.length === 0;
  const isLoadingForCurrentSession =
    (loadingChatHistory || fetchingChatHistory) &&
    (isInitialLoad || chatHistory?.session?.id === sessionId);
  const loading = isLoadingForCurrentSession;

  // Separate isSendingMessage from loading to distinguish between initial load and message sending
  const isSendingMessage = sendMessageMutation.isPending;

  return {
    messages,
    loading,
    isSendingMessage,
    sendMessage,
    setMessages,
  };
}
