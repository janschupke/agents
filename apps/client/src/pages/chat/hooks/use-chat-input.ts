import { useState, useEffect, useRef } from 'react';
import { NUMERIC_CONSTANTS } from '../../../constants/numeric.constants';
import { ChatInputRef } from '../components/chat/ChatInput';
import { SendMessageResponse } from '../../../types/chat.types';

interface UseChatInputOptions {
  currentSessionId: number | null;
  messagesLoading: boolean;
  showChatPlaceholder: boolean;
  sendMessage: (message: string) => Promise<SendMessageResponse | undefined>;
}

interface UseChatInputReturn {
  input: string;
  setInput: (value: string) => void;
  chatInputRef: React.RefObject<ChatInputRef>;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
}

/**
 * Manages chat input state and submission
 */
export function useChatInput({
  currentSessionId,
  messagesLoading,
  showChatPlaceholder,
  sendMessage,
}: UseChatInputOptions): UseChatInputReturn {
  const [input, setInput] = useState('');
  const chatInputRef = useRef<ChatInputRef>(null);

  // Focus chat input when session changes
  useEffect(() => {
    if (currentSessionId && !messagesLoading && !showChatPlaceholder) {
      const timer = setTimeout(() => {
        chatInputRef.current?.focus();
      }, NUMERIC_CONSTANTS.UI_DEBOUNCE_DELAY);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [currentSessionId, messagesLoading, showChatPlaceholder]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const message = input;
    setInput('');

    try {
      await sendMessage(message);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  return {
    input,
    setInput,
    chatInputRef,
    handleSubmit,
  };
}
