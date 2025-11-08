import { useState, useEffect, useRef, useCallback } from 'react';
import { ChatService } from '../services/chat.service.js';
import { Message, Session } from '../types/chat.types.js';

interface UseChatOptions {
  botId?: number;
  onError?: (error: Error) => void;
}

export function useChat({ botId, onError }: UseChatOptions) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [botName, setBotName] = useState<string>('');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadChatHistory = useCallback(
    async (sessionId?: number) => {
      if (!botId) return;
      try {
        const data = await ChatService.getChatHistory(botId, sessionId);
        setMessages(data.messages || []);
        setBotName(data.bot?.name || 'Chat Bot');
        if (data.session?.id) {
          setCurrentSessionId((prev) => {
            if (prev !== data.session.id) {
              return data.session.id;
            }
            return prev;
          });
        }
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Unknown error');
        console.error('Error loading chat history:', err);
        onError?.(err);
      }
    },
    [botId, onError],
  );

  const loadSessions = useCallback(async () => {
    if (!botId) return;
    setSessionsLoading(true);
    try {
      const sessionsData = await ChatService.getSessions(botId);
      setSessions(sessionsData);
      setCurrentSessionId((prev) => {
        if (prev === null && sessionsData.length > 0) {
          return sessionsData[0].id;
        }
        return prev;
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      console.error('Error loading sessions:', err);
      onError?.(err);
    } finally {
      setSessionsLoading(false);
    }
  }, [botId, onError]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  useEffect(() => {
    if (sessions.length > 0 && currentSessionId === null) {
      // If no current session but we have sessions, load the latest one
      setCurrentSessionId(sessions[0].id);
    } else if (sessions.length === 0 && currentSessionId === null) {
      // If no sessions, load chat history which will create a session
      loadChatHistory();
    }
  }, [sessions.length, currentSessionId, loadChatHistory]);

  useEffect(() => {
    if (currentSessionId !== null) {
      loadChatHistory(currentSessionId);
    }
  }, [currentSessionId, loadChatHistory]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSessionSelect = async (sessionId: number) => {
    setCurrentSessionId(sessionId);
    await loadChatHistory(sessionId);
  };

  const handleNewSession = async () => {
    if (!botId) return;
    setSessionsLoading(true);
    try {
      const newSession = await ChatService.createSession(botId);
      setSessions((prev) => [newSession, ...prev]);
      setCurrentSessionId(newSession.id);
      setMessages([]);
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      console.error('Error creating session:', err);
      onError?.(err);
    } finally {
      setSessionsLoading(false);
    }
  };

  const sendMessage = async (message: string) => {
    if (!message.trim() || loading || !botId) return;

    const userMessage: Message = { role: 'user', content: message };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const data = await ChatService.sendMessage(
        botId,
        message,
        currentSessionId || undefined,
      );
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response,
      };
      setMessages((prev) => [...prev, assistantMessage]);

      // Update sessions if a new session was created
      if (data.session?.id && currentSessionId !== data.session.id) {
        setCurrentSessionId(data.session.id);
        await loadSessions();
      }
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
    sessions,
    currentSessionId,
    sessionsLoading,
    handleSessionSelect,
    handleNewSession,
  };
}
