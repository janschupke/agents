import { useState, useEffect, useRef } from 'react';
import { Message, MessageRole } from '../../../types/chat.types';
import { useChatHistory } from '../../../hooks/queries/use-chat';
import { useSendMessage } from '../../../hooks/mutations/use-chat-mutations';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../../hooks/queries/query-keys';

interface UseChatMessagesOptions {
  botId: number | null;
  sessionId: number | null;
}

interface UseChatMessagesReturn {
  messages: Message[];
  loading: boolean;
  sendMessage: (message: string) => Promise<void>;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}

/**
 * Hook to manage chat messages state and operations
 * Extracted from ChatBot component
 */
export function useChatMessages({
  botId,
  sessionId,
}: UseChatMessagesOptions): UseChatMessagesReturn {
  const queryClient = useQueryClient();
  const { data: chatHistory, isLoading: loadingChatHistory } = useChatHistory(botId, sessionId);
  const sendMessageMutation = useSendMessage();
  const [messages, setMessages] = useState<Message[]>([]);
  const previousMessageCountRef = useRef(0);
  const isInitialLoadRef = useRef(true);

  // Update messages from chat history
  useEffect(() => {
    if (chatHistory && botId && sessionId) {
      const historySessionId = chatHistory.session?.id;
      if (historySessionId === sessionId && chatHistory.messages) {
        setMessages(chatHistory.messages);
      }
    } else if (!sessionId) {
      setMessages([]);
    }
  }, [chatHistory, botId, sessionId]);

  // Reset initial load flag when session changes
  useEffect(() => {
    isInitialLoadRef.current = true;
    previousMessageCountRef.current = 0;
  }, [sessionId]);

  const sendMessage = async (message: string) => {
    if (!message.trim() || !botId) return;

    // Optimistically add user message
    const userMessage: Message = {
      role: MessageRole.USER,
      content: message,
    };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const result = await sendMessageMutation.mutateAsync({
        botId,
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
        if (lastUserIndex >= 0 && updated[lastUserIndex]?.role === MessageRole.USER) {
          updated[lastUserIndex] = {
            ...updated[lastUserIndex],
            id: result.userMessageId ?? updated[lastUserIndex].id,
            rawRequest: result.rawRequest,
          };
        }
        return [...updated, assistantMessage];
      });

      // If new session was created, invalidate sessions query
      if (result.session?.id && result.session.id !== sessionId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.bots.sessions(botId) });
      }

      return result;
    } catch (error) {
      // Remove optimistic user message on error
      setMessages((prev) => prev.slice(0, -1));
      console.error('Failed to send message:', error);
      throw error;
    }
  };

  const loading = loadingChatHistory || sendMessageMutation.isPending;

  return {
    messages,
    loading,
    sendMessage,
    setMessages,
  };
}
