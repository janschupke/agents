import { useState, useEffect, useRef, useCallback } from 'react';
import { ChatService } from '../services/chat.service.js';
import { Message, Session } from '../types/chat.types.js';
import { useSessionCache } from '../contexts/AppContext.js';

interface UseChatOptions {
  botId?: number;
  onError?: (error: Error) => void;
}

export function useChat({ botId, onError }: UseChatOptions) {
  const {
    getCachedSession,
    setCachedSession,
    invalidateSessionCache,
    getCachedSessionsList,
    setCachedSessionsList,
    invalidateSessionsListCache,
  } = useSessionCache();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [botName, setBotName] = useState<string>('');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Track current bot/session to detect changes
  const lastBotIdRef = useRef<number | undefined>(botId);
  const lastSessionIdRef = useRef<number | null>(null);

  const loadChatHistory = useCallback(
    async (sessionId?: number, forceRefresh = false) => {
      if (!botId) return;
      
      // Check cache first (unless force refresh or bot/session changed)
      const botChanged = lastBotIdRef.current !== botId;
      const sessionChanged = lastSessionIdRef.current !== sessionId;
      
      if (!forceRefresh && !botChanged && !sessionChanged && sessionId) {
        const cached = getCachedSession(botId, sessionId);
        if (cached) {
          setMessages(cached.messages);
          setBotName(cached.botName);
          setCurrentSessionId(sessionId);
          lastBotIdRef.current = botId;
          lastSessionIdRef.current = sessionId;
          return;
        }
      }
      
      try {
        const data = await ChatService.getChatHistory(botId, sessionId);
        // Messages from API now include rawRequest and rawResponse
        const messagesData = data.messages || [];
        const botNameData = data.bot?.name || 'Chat Bot';
        
        setMessages(messagesData);
        setBotName(botNameData);
        
        if (data.session?.id) {
          setCurrentSessionId(data.session.id);
          lastSessionIdRef.current = data.session.id;
          
          // Cache the session data
          setCachedSession(botId, data.session.id, {
            messages: messagesData,
            botName: botNameData,
            session: data.session,
            bot: data.bot || { id: botId, name: botNameData, description: null },
            lastUpdated: Date.now(),
          });
        }
        
        lastBotIdRef.current = botId;
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Unknown error');
        console.error('Error loading chat history:', err);
        onError?.(err);
      }
    },
    [botId, onError, getCachedSession, setCachedSession, botName],
  );

  const loadSessions = useCallback(async (forceRefresh = false) => {
    if (!botId) return;
    
    // Check cache first (unless force refresh or bot changed)
    const botChanged = lastBotIdRef.current !== botId;
    
    if (!forceRefresh && !botChanged) {
      const cached = getCachedSessionsList(botId);
      if (cached) {
        setSessions(cached);
        setCurrentSessionId((prev) => {
          if (prev === null && cached.length > 0) {
            return cached[0].id;
          }
          return prev;
        });
        lastBotIdRef.current = botId;
        return;
      }
    }
    
    setSessionsLoading(true);
    try {
      const sessionsData = await ChatService.getSessions(botId);
      setSessions(sessionsData);
      setCachedSessionsList(botId, sessionsData);
      setCurrentSessionId((prev) => {
        if (prev === null && sessionsData.length > 0) {
          return sessionsData[0].id;
        }
        return prev;
      });
      lastBotIdRef.current = botId;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      console.error('Error loading sessions:', err);
      onError?.(err);
    } finally {
      setSessionsLoading(false);
    }
  }, [botId, onError, getCachedSessionsList, setCachedSessionsList]);

  // Reset state when bot changes (but keep cache - it will be used when switching back)
  useEffect(() => {
    if (botId !== lastBotIdRef.current && lastBotIdRef.current !== undefined) {
      // Clear all session caches for the old bot when switching away
      const oldBotId = lastBotIdRef.current;
      invalidateSessionCache(oldBotId); // Clear all sessions for old bot
      invalidateSessionsListCache(oldBotId);
      
      // Reset local state for the new bot
      setMessages([]);
      setSessions([]);
      setCurrentSessionId(null);
      lastSessionIdRef.current = null;
    }
    lastBotIdRef.current = botId;
  }, [botId, invalidateSessionCache, invalidateSessionsListCache]);

  useEffect(() => {
    if (botId) {
      loadSessions();
    }
  }, [botId, loadSessions]);

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
    if (currentSessionId !== null && botId) {
      // Only reload if session actually changed
      if (lastSessionIdRef.current !== currentSessionId) {
        loadChatHistory(currentSessionId);
      }
    }
  }, [currentSessionId, botId, loadChatHistory]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSessionSelect = async (sessionId: number) => {
    if (sessionId === currentSessionId) return; // Already selected
    setCurrentSessionId(sessionId);
    await loadChatHistory(sessionId);
  };

  const handleNewSession = async () => {
    if (!botId) return;
    setSessionsLoading(true);
    try {
      const newSession = await ChatService.createSession(botId);
      const updatedSessions = [newSession, ...sessions];
      setSessions(updatedSessions);
      setCachedSessionsList(botId, updatedSessions);
      setCurrentSessionId(newSession.id);
      setMessages([]);
      lastSessionIdRef.current = newSession.id;
      // Invalidate cache for the new session (it's empty anyway)
      invalidateSessionCache(botId, newSession.id);
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

    // Prepare user message with raw request data
    const userMessage: Message = { 
      role: 'user', 
      content: message,
      // We'll update this with the actual request after the API call
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const data = await ChatService.sendMessage(
        botId,
        message,
        currentSessionId || undefined,
      );
      
      // Update the last user message with raw request data
      setMessages((prev) => {
        const updated = [...prev];
        const lastUserMsg = updated[updated.length - 2];
        if (lastUserMsg && lastUserMsg.role === 'user') {
          lastUserMsg.rawRequest = data.rawRequest;
        }
        return updated;
      });

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response,
        rawResponse: data.rawResponse,
      };
      
      // Get current messages state and update cache
      setMessages((prev) => {
        const updated = [...prev, assistantMessage];
        
        // Update session ID if changed
        const finalSessionId = data.session?.id || currentSessionId;
        if (finalSessionId && finalSessionId !== currentSessionId) {
          setCurrentSessionId(finalSessionId);
          lastSessionIdRef.current = finalSessionId;
          loadSessions(true); // Force refresh sessions list
        }
        
        // Update cache with new messages
        if (botId && finalSessionId) {
          const cached = getCachedSession(botId, finalSessionId);
          const currentBotName = botName || 'Chat Bot';
          if (cached) {
            setCachedSession(botId, finalSessionId, {
              ...cached,
              messages: updated,
            });
          } else {
            // If not cached, cache it now
            setCachedSession(botId, finalSessionId, {
              messages: updated,
              botName: currentBotName,
              session: data.session || { id: finalSessionId, session_name: null },
              bot: { id: botId, name: currentBotName, description: null },
              lastUpdated: Date.now(),
            });
          }
        }
        
        return updated;
      });
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
