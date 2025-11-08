import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useUser } from '@clerk/clerk-react';
import { User, Bot } from '../types/chat.types';
import { UserService } from '../services/user.service';
import { BotService } from '../services/bot.service';

interface AppContextValue {
  // User data
  userInfo: User | null;
  loadingUser: boolean;
  refreshUser: () => Promise<void>;

  // Bots data
  bots: Bot[];
  loadingBots: boolean;
  refreshBots: () => Promise<void>;
  getBot: (id: number) => Bot | undefined;
  updateBotInCache: (bot: Bot) => void;
  addBotToCache: (bot: Bot) => void;
  removeBotFromCache: (id: number) => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const { isSignedIn, isLoaded } = useUser();
  const [userInfo, setUserInfo] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(false);
  const [bots, setBots] = useState<Bot[]>([]);
  const [loadingBots, setLoadingBots] = useState(false);

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
  }, []);

  // Load user info when signed in
  useEffect(() => {
    if (isSignedIn && isLoaded) {
      const timer = setTimeout(() => {
        loadUserInfo();
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setUserInfo(null);
    }
  }, [isSignedIn, isLoaded, loadUserInfo]);

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
    bots,
    loadingBots,
    refreshBots,
    getBot,
    updateBotInCache,
    addBotToCache,
    removeBotFromCache,
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
