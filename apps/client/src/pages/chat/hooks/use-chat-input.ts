import { useState, useRef } from 'react';
import { ChatInputRef } from '../components/chat/ChatInput';
import { SendMessageResponse } from '../../../types/chat.types';
import { useChatInputFocus } from './use-chat-input-focus';

interface UseChatInputOptions {
  currentSessionId: number | null;
  messagesLoading: boolean;
  showChatPlaceholder: boolean;
  showTypingIndicator?: boolean;
  agentId: number | null;
  sendMessage: (message: string) => Promise<SendMessageResponse | undefined>;
}

interface UseChatInputReturn {
  input: string;
  setInput: (value: string) => void;
  chatInputRef: React.RefObject<ChatInputRef>;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  onRefReady: (ref: ChatInputRef) => void;
}

/**
 * Manages chat input state and submission
 */
export function useChatInput({
  currentSessionId,
  messagesLoading,
  showChatPlaceholder,
  showTypingIndicator = false,
  agentId,
  sendMessage,
}: UseChatInputOptions): UseChatInputReturn {
  const [input, setInput] = useState('');
  const chatInputRef = useRef<ChatInputRef>(null);
  const isInputDisabled = showTypingIndicator;

  // Unified focus management - returns callback ref handler
  const handleRefReady = useChatInputFocus({
    chatInputRef,
    currentSessionId,
    messagesLoading,
    showChatPlaceholder,
    showTypingIndicator,
    isInputDisabled,
    agentId,
  });

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
    onRefReady: handleRefReady,
  };
}
