import { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import { useUser } from '@clerk/clerk-react';
import { User, Bot, Session, ChatHistoryResponse, Message } from '../types/chat.types';
import { UserService } from '../services/user.service';
import { BotService } from '../services/bot.service';
import { ApiCredentialsService } from '../services/api-credentials.service';

// Cache key helpers
type SessionCacheKey = `${number}-${number}`; // botId-sessionId
type BotConfigCacheKey = number; // botId
type SessionsListCacheKey = number; // botId

interface CachedSessionData {
  messages: Message[];
  botName: string;
  session: ChatHistoryResponse['session'];
  bot: ChatHistoryResponse['bot'];
  lastUpdated: number;
}

interface CachedBotConfig {
  temperature: number;
  system_prompt: string;
  behavior_rules: string[];
  lastUpdated: number;
}

interface AppContextValue {
  // User data
  userInfo: User | null;
  loadingUser: boolean;
  refreshUser: () => Promise<void>;

  // API Key status
  hasApiKey: boolean | null;
  loadingApiKey: boolean;
  refreshApiKey: () => Promise<void>;

  // Bots data
  bots: Bot[];
  loadingBots: boolean;
  refreshBots: () => Promise<void>;
  getBot: (id: number) => Bot | undefined;
  updateBotInCache: (bot: Bot) => void;
  addBotToCache: (bot: Bot) => void;
  removeBotFromCache: (id: number) => void;

  // Session cache
  getCachedSession: (botId: number, sessionId: number) => CachedSessionData | null;
  setCachedSession: (botId: number, sessionId: number, data: CachedSessionData) => void;
  invalidateSessionCache: (botId: number, sessionId?: number) => void;
  getCachedSessionsList: (botId: number) => Session[] | null;
  setCachedSessionsList: (botId: number, sessions: Session[]) => void;
  invalidateSessionsListCache: (botId: number) => void;

  // Bot config cache
  getCachedBotConfig: (botId: number) => CachedBotConfig | null;
  setCachedBotConfig: (botId: number, config: CachedBotConfig) => void;
  invalidateBotConfigCache: (botId: number) => void;

  // Selected bot persistence
  selectedBotId: number | null;
  setSelectedBotId: (botId: number | null) => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const { isSignedIn, isLoaded } = useUser();
  const [userInfo, setUserInfo] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(false);
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);
  const [loadingApiKey, setLoadingApiKey] = useState(false);
  const [bots, setBots] = useState<Bot[]>([]);
  const [loadingBots, setLoadingBots] = useState(false);
  const [selectedBotId, setSelectedBotId] = useState<number | null>(null);

  // Cache storage using refs to persist across renders
  const sessionCacheRef = useRef<Map<SessionCacheKey, CachedSessionData>>(new Map());
  const sessionsListCacheRef = useRef<Map<SessionsListCacheKey, Session[]>>(new Map());
  const botConfigCacheRef = useRef<Map<BotConfigCacheKey, CachedBotConfig>>(new Map());

  const loadUserInfo = useCallback(async () => {
    if (!isSignedIn || !isLoaded) {
      setUserInfo(null);
      return;
    }

    setLoadingUser(true);
    try {
      const user = await UserService.getCurrentUser();
      setUserInfo(user);
    } catch (error: unknown) {
      // Silently fail if it's an expected auth error (no token yet)
      if (error && typeof error === 'object' && 'expected' in error && !error.expected) {
        console.error('Failed to load user info:', error);
      }
      setUserInfo(null);
    } finally {
      setLoadingUser(false);
    }
  }, [isSignedIn, isLoaded]);

  const loadBots = useCallback(async () => {
    if (!isSignedIn || !isLoaded) {
      setBots([]);
      return;
    }

    setLoadingBots(true);
    try {
      const data = await BotService.getAllBots();
      setBots(data);
    } catch (error) {
      console.error('Failed to load bots:', error);
      setBots([]);
    } finally {
      setLoadingBots(false);
    }
  }, [isSignedIn, isLoaded]);

  const refreshUser = useCallback(async () => {
    await loadUserInfo();
  }, [loadUserInfo]);

  const loadApiKeyStatus = useCallback(async () => {
    if (!isSignedIn || !isLoaded) {
      setHasApiKey(null);
      return;
    }

    setLoadingApiKey(true);
    try {
      const hasKey = await ApiCredentialsService.hasOpenAIKey();
      setHasApiKey(hasKey);
    } catch (error: unknown) {
      const apiError = error as { expected?: boolean; message?: string };
      if (!apiError.expected) {
        console.error('Failed to load API key status:', error);
      }
      setHasApiKey(false);
    } finally {
      setLoadingApiKey(false);
    }
  }, [isSignedIn, isLoaded]);

  const refreshApiKey = useCallback(async () => {
    await loadApiKeyStatus();
  }, [loadApiKeyStatus]);

  const refreshBots = useCallback(async () => {
    await loadBots();
  }, [loadBots]);

  const getBot = useCallback((id: number): Bot | undefined => {
    return bots.find((bot) => bot.id === id);
  }, [bots]);

  const updateBotInCache = useCallback((bot: Bot) => {
    setBots((prev) => prev.map((b) => (b.id === bot.id ? bot : b)));
  }, []);

  const addBotToCache = useCallback((bot: Bot) => {
    setBots((prev) => {
      // Don't add if already exists
      if (prev.some((b) => b.id === bot.id)) {
        return prev.map((b) => (b.id === bot.id ? bot : b));
      }
      return [...prev, bot];
    });
  }, []);

  const removeBotFromCache = useCallback((id: number) => {
    setBots((prev) => prev.filter((b) => b.id !== id));
    // Also invalidate related caches
    sessionsListCacheRef.current.delete(id);
    botConfigCacheRef.current.delete(id);
    // Invalidate all sessions for this bot
    const keysToDelete: SessionCacheKey[] = [];
    sessionCacheRef.current.forEach((_, key) => {
      if (key.startsWith(`${id}-`)) {
        keysToDelete.push(key as SessionCacheKey);
      }
    });
    keysToDelete.forEach((key) => sessionCacheRef.current.delete(key));
  }, []);

  // Session cache methods
  const getCachedSession = useCallback((botId: number, sessionId: number): CachedSessionData | null => {
    const key: SessionCacheKey = `${botId}-${sessionId}`;
    return sessionCacheRef.current.get(key) || null;
  }, []);

  const setCachedSession = useCallback((botId: number, sessionId: number, data: CachedSessionData) => {
    const key: SessionCacheKey = `${botId}-${sessionId}`;
    sessionCacheRef.current.set(key, { ...data, lastUpdated: Date.now() });
  }, []);

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

  // Sessions list cache methods
  const getCachedSessionsList = useCallback((botId: number): Session[] | null => {
    return sessionsListCacheRef.current.get(botId) || null;
  }, []);

  const setCachedSessionsList = useCallback((botId: number, sessions: Session[]) => {
    sessionsListCacheRef.current.set(botId, sessions);
  }, []);

  const invalidateSessionsListCache = useCallback((botId: number) => {
    sessionsListCacheRef.current.delete(botId);
  }, []);

  // Bot config cache methods
  const getCachedBotConfig = useCallback((botId: number): CachedBotConfig | null => {
    return botConfigCacheRef.current.get(botId) || null;
  }, []);

  const setCachedBotConfig = useCallback((botId: number, config: CachedBotConfig) => {
    botConfigCacheRef.current.set(botId, { ...config, lastUpdated: Date.now() });
  }, []);

  const invalidateBotConfigCache = useCallback((botId: number) => {
    botConfigCacheRef.current.delete(botId);
  }, []);

  // Load user info once when signed in (not on every route change)
  useEffect(() => {
    if (isSignedIn && isLoaded) {
      // Only load if we don't already have user info
      if (!userInfo) {
        const timer = setTimeout(() => {
          loadUserInfo();
        }, 100);
        return () => clearTimeout(timer);
      }
    } else {
      setUserInfo(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn, isLoaded]); // Intentionally exclude loadUserInfo and userInfo to prevent re-fetching

  // Load API key status once when signed in (not on every route change)
  useEffect(() => {
    if (isSignedIn && isLoaded) {
      // Only load if we don't already have API key status
      if (hasApiKey === null) {
        const timer = setTimeout(() => {
          loadApiKeyStatus();
        }, 100);
        return () => clearTimeout(timer);
      }
    } else {
      setHasApiKey(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn, isLoaded]); // Intentionally exclude loadApiKeyStatus and hasApiKey to prevent re-fetching

  // Listen for API key save/delete events to refresh cache
  useEffect(() => {
    if (!isSignedIn || !isLoaded) return;

    const handleApiKeySaved = () => {
      loadApiKeyStatus();
    };

    window.addEventListener('apiKeySaved', handleApiKeySaved);
    return () => {
      window.removeEventListener('apiKeySaved', handleApiKeySaved);
    };
  }, [isSignedIn, isLoaded, loadApiKeyStatus]);

  // Load bots when signed in
  useEffect(() => {
    if (isSignedIn && isLoaded) {
      const timer = setTimeout(() => {
        loadBots();
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setBots([]);
    }
  }, [isSignedIn, isLoaded, loadBots]);

  const value: AppContextValue = {
    userInfo,
    loadingUser,
    refreshUser,
    hasApiKey,
    loadingApiKey,
    refreshApiKey,
    bots,
    loadingBots,
    refreshBots,
    getBot,
    updateBotInCache,
    addBotToCache,
    removeBotFromCache,
    getCachedSession,
    setCachedSession,
    invalidateSessionCache,
    getCachedSessionsList,
    setCachedSessionsList,
    invalidateSessionsListCache,
    getCachedBotConfig,
    setCachedBotConfig,
    invalidateBotConfigCache,
    selectedBotId,
    setSelectedBotId,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}

// Convenience hooks
export function useUserInfo() {
  const { userInfo, loadingUser, refreshUser } = useAppContext();
  return { userInfo, loadingUser, refreshUser };
}

// Hook for API key status
export function useApiKeyStatus() {
  const { hasApiKey, loadingApiKey, refreshApiKey } = useAppContext();
  return { hasApiKey, loadingApiKey, refreshApiKey };
}

export function useBots() {
  const {
    bots,
    loadingBots,
    refreshBots,
    getBot,
    updateBotInCache,
    addBotToCache,
    removeBotFromCache,
  } = useAppContext();
  return {
    bots,
    loadingBots,
    refreshBots,
    getBot,
    updateBotInCache,
    addBotToCache,
    removeBotFromCache,
  };
}

// Hook for session cache
export function useSessionCache() {
  const {
    getCachedSession,
    setCachedSession,
    invalidateSessionCache,
    getCachedSessionsList,
    setCachedSessionsList,
    invalidateSessionsListCache,
  } = useAppContext();
  return {
    getCachedSession,
    setCachedSession,
    invalidateSessionCache,
    getCachedSessionsList,
    setCachedSessionsList,
    invalidateSessionsListCache,
  };
}

// Hook for bot config cache
export function useBotConfigCache() {
  const {
    getCachedBotConfig,
    setCachedBotConfig,
    invalidateBotConfigCache,
  } = useAppContext();
  return {
    getCachedBotConfig,
    setCachedBotConfig,
    invalidateBotConfigCache,
  };
}

// Hook for selected bot
export function useSelectedBot() {
  const { selectedBotId, setSelectedBotId } = useAppContext();
  return { selectedBotId, setSelectedBotId };
}
