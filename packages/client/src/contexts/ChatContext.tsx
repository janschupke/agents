import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Message } from '../types/chat.types';
import { LocalStorageManager } from '../utils/localStorage';

interface ChatContextValue {
  // Current session messages (deprecated - use React Query hooks)
  messages: Message[];
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateLastUserMessage: (update: Partial<Message>) => void;

  // Current session info
  currentBotId: number | null;
  currentSessionId: number | null;
  setCurrentSessionId: (sessionId: number | null) => void;
  botName: string;

  // Loading states (deprecated - use React Query hooks)
  loadingMessages: boolean;
  loadingSession: boolean;

  // Actions (deprecated - use React Query hooks)
  loadChatHistory: (botId: number, sessionId?: number, forceRefresh?: boolean) => Promise<void>;
  sendMessage: (
    botId: number,
    message: string,
    sessionId?: number
  ) => Promise<{ sessionId: number | null; isNewSession: boolean }>;

  // Cache management (deprecated - React Query handles caching)
  getCachedSession: (botId: number, sessionId: number) => unknown;
  setCachedSession: (botId: number, sessionId: number, data: unknown) => void;
  invalidateSessionCache: (botId: number, sessionId?: number) => void;
}

const ChatContext = createContext<ChatContextValue | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentBotId] = useState<number | null>(null);
  const [currentSessionId, setCurrentSessionIdState] = useState<number | null>(() =>
    LocalStorageManager.getSelectedSessionId()
  );
  const [botName] = useState<string>('');
  const [loadingMessages] = useState(false);
  const [loadingSession] = useState(false);

  // Save to localStorage whenever currentSessionId changes
  useEffect(() => {
    LocalStorageManager.setSelectedSessionId(currentSessionId);
  }, [currentSessionId]);

  const setCurrentSessionId = useCallback((sessionId: number | null) => {
    setCurrentSessionIdState(sessionId);
  }, []);

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

  // Deprecated methods - kept for backward compatibility
  const loadChatHistory = useCallback(async () => {
    // Deprecated - use useChatHistory hook instead
    console.warn('loadChatHistory is deprecated, use useChatHistory hook instead');
  }, []);

  const sendMessage = useCallback(async () => {
    // Deprecated - use useSendMessage hook instead
    console.warn('sendMessage is deprecated, use useSendMessage hook instead');
    return { sessionId: null, isNewSession: false };
  }, []);

  const getCachedSession = useCallback(() => {
    // Deprecated - React Query handles caching
    return null;
  }, []);

  const setCachedSession = useCallback(() => {
    // Deprecated - React Query handles caching
  }, []);

  const invalidateSessionCache = useCallback(() => {
    // Deprecated - use queryClient.invalidateQueries instead
  }, []);

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
