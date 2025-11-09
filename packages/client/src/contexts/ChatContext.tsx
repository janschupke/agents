import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  ReactNode,
} from 'react';
import { Message, ChatHistoryResponse } from '../types/chat.types';
import { ChatService } from '../services/chat.service';
import { useAuth } from './AuthContext';
import { LocalStorageManager } from '../utils/localStorage';

interface CachedSessionData {
  messages: Message[];
  botName: string;
  session: ChatHistoryResponse['session'];
  bot: ChatHistoryResponse['bot'];
  lastUpdated: number;
}

type SessionCacheKey = `${number}-${number}`; // botId-sessionId

interface ChatContextValue {
  // Current session messages
  messages: Message[];
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateLastUserMessage: (update: Partial<Message>) => void;

  // Current session info
  currentBotId: number | null;
  currentSessionId: number | null;
  setCurrentSessionId: (sessionId: number | null) => void;
  botName: string;

  // Loading states
  loadingMessages: boolean;
  loadingSession: boolean;

  // Actions
  loadChatHistory: (botId: number, sessionId?: number, forceRefresh?: boolean) => Promise<void>;
  sendMessage: (
    botId: number,
    message: string,
    sessionId?: number
  ) => Promise<{ sessionId: number | null; isNewSession: boolean }>;

  // Cache management
  getCachedSession: (botId: number, sessionId: number) => CachedSessionData | null;
  setCachedSession: (botId: number, sessionId: number, data: CachedSessionData) => void;
  invalidateSessionCache: (botId: number, sessionId?: number) => void;
}

const ChatContext = createContext<ChatContextValue | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const { isSignedIn, isLoaded } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentBotId, setCurrentBotId] = useState<number | null>(null);
  // Load initial session ID from localStorage (will be validated when bot loads)
  const [currentSessionId, setCurrentSessionIdState] = useState<number | null>(() =>
    LocalStorageManager.getSelectedSessionId()
  );
  const [botName, setBotName] = useState<string>('');
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingSession, setLoadingSession] = useState(false);

  // Save to localStorage whenever currentSessionId changes
  useEffect(() => {
    LocalStorageManager.setSelectedSessionId(currentSessionId);
  }, [currentSessionId]);

  // Wrapper to update state (localStorage is saved via useEffect above)
  const setCurrentSessionId = useCallback((sessionId: number | null) => {
    setCurrentSessionIdState(sessionId);
  }, []);

  // Session cache using ref
  const sessionCacheRef = useRef<Map<SessionCacheKey, CachedSessionData>>(new Map());

  // Track current bot/session to detect changes
  const lastBotIdRef = useRef<number | null>(null);
  const lastSessionIdRef = useRef<number | null>(null);

  const getCachedSession = useCallback(
    (botId: number, sessionId: number): CachedSessionData | null => {
      const key: SessionCacheKey = `${botId}-${sessionId}`;
      return sessionCacheRef.current.get(key) || null;
    },
    []
  );

  const setCachedSession = useCallback(
    (botId: number, sessionId: number, data: CachedSessionData) => {
      const key: SessionCacheKey = `${botId}-${sessionId}`;
      sessionCacheRef.current.set(key, { ...data, lastUpdated: Date.now() });
    },
    []
  );

  const invalidateSessionCache = useCallback((botId: number, sessionId?: number) => {
    if (sessionId !== undefined) {
      const key: SessionCacheKey = `${botId}-${sessionId}`;
      sessionCacheRef.current.delete(key);
    } else {
      // Invalidate all sessions for this bot
      const keysToDelete: SessionCacheKey[] = [];
      sessionCacheRef.current.forEach((_, key) => {
        if (key.startsWith(`${botId}-`)) {
          keysToDelete.push(key as SessionCacheKey);
        }
      });
      keysToDelete.forEach((key) => sessionCacheRef.current.delete(key));
    }
  }, []);

  const loadChatHistory = useCallback(
    async (botId: number, sessionId?: number, forceRefresh = false) => {
      if (!isSignedIn || !isLoaded) {
        return;
      }

      // Check if we already have the correct bot/session loaded (no need to reload)
      // Use refs to avoid stale closure issues - refs are updated when we load
      if (
        !forceRefresh &&
        lastBotIdRef.current === botId &&
        lastSessionIdRef.current === (sessionId || null)
      ) {
        return;
      }

      // Check cache first (unless force refresh or bot/session changed)
      const botChanged = lastBotIdRef.current !== botId;
      const sessionChanged = lastSessionIdRef.current !== sessionId;

      if (!forceRefresh && !botChanged && !sessionChanged && sessionId) {
        const cached = getCachedSession(botId, sessionId);
        if (cached) {
          setMessages(cached.messages);
          setBotName(cached.botName);
          setCurrentBotId(botId);
          setCurrentSessionId(sessionId);
          lastBotIdRef.current = botId;
          lastSessionIdRef.current = sessionId;
          return;
        }
      }

      setLoadingMessages(true);

      try {
        const data = await ChatService.getChatHistory(botId, sessionId);
        const messagesData = data.messages || [];
        const botNameData = data.bot?.name || 'Chat Bot';
        const finalSessionId = data.session?.id || sessionId || null;

        setMessages(messagesData);
        setBotName(botNameData);
        setCurrentBotId(botId);
        setCurrentSessionId(finalSessionId);

        if (finalSessionId) {
          lastSessionIdRef.current = finalSessionId;

          // Cache the session data
          setCachedSession(botId, finalSessionId, {
            messages: messagesData,
            botName: botNameData,
            session: data.session || { id: finalSessionId, session_name: null },
            bot: data.bot || { id: botId, name: botNameData, description: null },
            lastUpdated: Date.now(),
          });
        }

        lastBotIdRef.current = botId;
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Unknown error');
        console.error('Error loading chat history:', err);
        // Clear messages on error to show invalid state
        setMessages([]);
        setCurrentBotId(null);
        setCurrentSessionId(null);
        throw err;
      } finally {
        setLoadingMessages(false);
      }
    },
    [
      isSignedIn,
      isLoaded,
      getCachedSession,
      setCachedSession,
      setCurrentSessionId,
      setCurrentBotId,
      setMessages,
      setBotName,
      setLoadingMessages,
    ]
  );

  const sendMessage = useCallback(
    async (
      botId: number,
      message: string,
      sessionId?: number
    ): Promise<{ sessionId: number | null; isNewSession: boolean }> => {
      if (!isSignedIn || !isLoaded) {
        return { sessionId: currentSessionId, isNewSession: false };
      }

      // Prepare user message
      const userMessage: Message = {
        role: 'user',
        content: message,
      };

      setMessages((prev) => [...prev, userMessage]);
      setLoadingSession(true);

      try {
        const data = await ChatService.sendMessage(
          botId,
          message,
          sessionId || currentSessionId || undefined
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

        // Update messages and session ID if changed
        const finalSessionId = data.session?.id || currentSessionId;
        const isNewSession = finalSessionId !== null && finalSessionId !== currentSessionId;

        setMessages((prev) => {
          const updated = [...prev, assistantMessage];

          if (finalSessionId && finalSessionId !== currentSessionId) {
            setCurrentSessionId(finalSessionId);
            lastSessionIdRef.current = finalSessionId;
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

        // Ensure current bot ID is set
        if (currentBotId !== botId) {
          setCurrentBotId(botId);
          lastBotIdRef.current = botId;
        }

        // Return session info for syncing with BotContext
        return { sessionId: finalSessionId, isNewSession };
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Unknown error');
        console.error('Error sending message:', err);
        const errorMessage: Message = {
          role: 'assistant',
          content: `Error: ${err.message}`,
        };
        setMessages((prev) => [...prev, errorMessage]);
        // Return error state instead of throwing to match return type
        return { sessionId: currentSessionId, isNewSession: false };
      } finally {
        setLoadingSession(false);
      }
    },
    [
      isSignedIn,
      isLoaded,
      currentSessionId,
      currentBotId,
      botName,
      getCachedSession,
      setCachedSession,
      setCurrentSessionId,
      setCurrentBotId,
      setMessages,
      setLoadingSession,
    ]
  );

  const addMessage = useCallback((message: Message) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  const updateLastUserMessage = useCallback((update: Partial<Message>) => {
    setMessages((prev) => {
      const updated = [...prev];
      for (let i = updated.length - 1; i >= 0; i--) {
        if (updated[i].role === 'user') {
          updated[i] = { ...updated[i], ...update };
          break;
        }
      }
      return updated;
    });
  }, []);

  // Reset state when bot changes - clear messages and session only when bot actually changes
  useEffect(() => {
    // If bot changed completely, clear caches and state
    if (
      currentBotId !== null &&
      currentBotId !== lastBotIdRef.current &&
      lastBotIdRef.current !== null
    ) {
      // Clear all session caches for the old bot when switching away
      invalidateSessionCache(lastBotIdRef.current);
      // Clear session and messages when bot changes (but preserve if navigating back to same bot)
      // Only clear if we're actually switching to a different bot
      setCurrentSessionId(null);
      setMessages([]);
      lastSessionIdRef.current = null;
    }
    lastBotIdRef.current = currentBotId;
  }, [currentBotId, invalidateSessionCache, setCurrentSessionId, setMessages]);

  const value: ChatContextValue = {
    messages,
    setMessages,
    addMessage,
    updateLastUserMessage,
    currentBotId,
    currentSessionId,
    setCurrentSessionId,
    botName,
    loadingMessages,
    loadingSession,
    loadChatHistory,
    sendMessage,
    getCachedSession,
    setCachedSession,
    invalidateSessionCache,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChatContext() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
}
