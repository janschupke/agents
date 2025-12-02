import { useState, useEffect, useRef, useCallback } from 'react';
import { ChatService } from '../services/chat.service.js';
import { Message, MessageRole, Session } from '../types/chat.types.js';
import { useChatContext } from '../contexts/ChatContext.js';
import { NUMERIC_CONSTANTS } from '../constants/numeric.constants.js';
import { WordTranslationService } from '../services/word-translation.service.js';

interface UseChatOptions {
  botId?: number;
  onError?: (error: Error) => void;
}

export function useChat({ botId, onError }: UseChatOptions) {
  const { getCachedSession, setCachedSession, invalidateSessionCache } = useChatContext();

  // Local cache for sessions list (not in ChatContext)
  const sessionsListCacheRef = useRef<Map<number, { sessions: Session[]; lastUpdated: number }>>(
    new Map()
  );

  const getCachedSessionsList = useCallback((botId: number): Session[] | null => {
    const cached = sessionsListCacheRef.current.get(botId);
    if (!cached) return null;
    // Cache valid for configured timeout
    if (Date.now() - cached.lastUpdated > NUMERIC_CONSTANTS.CACHE_TIMEOUT_MS) {
      sessionsListCacheRef.current.delete(botId);
      return null;
    }
    return cached.sessions;
  }, []);

  const setCachedSessionsList = useCallback((botId: number, sessions: Session[]) => {
    sessionsListCacheRef.current.set(botId, { sessions, lastUpdated: Date.now() });
  }, []);

  const invalidateSessionsListCache = useCallback((botId: number) => {
    sessionsListCacheRef.current.delete(botId);
  }, []);

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
    [botId, onError, getCachedSession, setCachedSession]
  );

  const loadSessions = useCallback(
    async (forceRefresh = false) => {
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
    },
    [botId, onError, getCachedSessionsList, setCachedSessionsList]
  );

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
  }, [sessions, currentSessionId, loadChatHistory]);

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
      role: MessageRole.USER,
      content: message,
      // We'll update this with the actual request after the API call
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const data = await ChatService.sendMessage(botId, message, currentSessionId || undefined);

      // Update the last user message with raw request data and ID
      setMessages((prev) => {
        const updated = [...prev];
        const lastUserMsgIndex = updated.length - 2;
        if (lastUserMsgIndex >= 0) {
          const lastUserMsg = updated[lastUserMsgIndex];
          if (lastUserMsg && lastUserMsg.role === MessageRole.USER) {
            updated[lastUserMsgIndex] = {
              ...lastUserMsg,
              rawRequest: data.rawRequest,
              id: data.userMessageId ?? lastUserMsg.id,
            };
          }
        }
        return updated;
      });

      const assistantMessage: Message = {
        role: MessageRole.ASSISTANT,
        content: data.response,
        rawResponse: data.rawResponse,
        id: data.assistantMessageId,
        // Translations are on-demand only - not included in initial response
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

      // Poll for translations if they're not ready yet (for assistant messages)
      // Note: SendMessageResponse doesn't include translations, so we always poll
      if (data.assistantMessageId) {
        // Poll for translations with exponential backoff
        let pollCount = 0;
        const maxPolls = 10;
        const pollInterval = NUMERIC_CONSTANTS.POLLING_INTERVAL_START;

        const pollForTranslations = async () => {
          if (pollCount >= maxPolls) return;

          try {
            const translations = await WordTranslationService.getMessageTranslations(data.assistantMessageId!);
            
            if (translations.translation && translations.wordTranslations.length > 0) {
              // Update the message with translations
              setMessages((prevMessages) => {
                return prevMessages.map((msg) => {
                  if (msg.id === data.assistantMessageId) {
                    return {
                      ...msg,
                      translation: translations.translation,
                      wordTranslations: translations.wordTranslations,
                    };
                  }
                  return msg;
                });
              });
            } else {
              // Continue polling
              pollCount++;
              setTimeout(pollForTranslations, pollInterval * Math.min(pollCount, 3));
            }
          } catch (error) {
            // Silently fail - translations are optional
            console.debug('Failed to fetch translations:', error);
          }
        };

        // Start polling after a short delay
        setTimeout(pollForTranslations, pollInterval);
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      console.error('Error sending message:', err);
      const errorMessage: Message = {
        role: MessageRole.ASSISTANT,
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
