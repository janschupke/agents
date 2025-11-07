import { useState, useEffect, useRef } from 'react';
import { ChatService } from '../services/chat.service.js';
import { Message } from '../types/chat.types.js';

interface UseChatOptions {
  botId: number;
  onError?: (error: Error) => void;
}

export function useChat({ botId, onError }: UseChatOptions) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [botName, setBotName] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadChatHistory();
  }, [botId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChatHistory = async () => {
    try {
      const data = await ChatService.getChatHistory(botId);
      setMessages(data.messages || []);
      setBotName(data.bot?.name || 'Chat Bot');
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      console.error('Error loading chat history:', err);
      onError?.(err);
    }
  };

  const sendMessage = async (message: string) => {
    if (!message.trim() || loading) return;

    const userMessage: Message = { role: 'user', content: message };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const data = await ChatService.sendMessage(botId, message);
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      console.error('Error sending message:', err);
      const errorMessage: Message = {
        role: 'assistant',
        content: `Error: ${err.message}`,
      };
      setMessages((prev) => [...prev, errorMessage]);
      onError?.(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendMessage(input);
  };

  return {
    messages,
    input,
    setInput,
    loading,
    botName,
    messagesEndRef,
    handleSubmit,
    sendMessage,
  };
}
