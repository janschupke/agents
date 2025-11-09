import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { Bot, Session } from '../types/chat.types';
import { BotService } from '../services/bot.service';
import { ChatService } from '../services/chat.service';
import { useAuth } from './AuthContext';

interface BotWithSessions extends Bot {
  sessions?: Session[];
}

interface BotContextValue {
  // Bots data
  bots: BotWithSessions[];
  loadingBots: boolean;
  refreshBots: () => Promise<void>;
  getBot: (id: number) => BotWithSessions | undefined;
  updateBot: (bot: Bot) => void;
  addBot: (bot: Bot) => void;
  removeBot: (id: number) => void;
  
  // Sessions for a specific bot
  getBotSessions: (botId: number) => Session[] | undefined;
  refreshBotSessions: (botId: number) => Promise<void>;
  addSessionToBot: (botId: number, session: Session) => void;
  removeSessionFromBot: (botId: number, sessionId: number) => void;
  
  // Bot config cache (not embeddings)
  getCachedBotConfig: (botId: number) => {
    temperature: number;
    system_prompt: string;
    behavior_rules: string[];
  } | null;
  setCachedBotConfig: (botId: number, config: {
    temperature: number;
    system_prompt: string;
    behavior_rules: string[];
  }) => void;
  invalidateBotConfigCache: (botId: number) => void;
}

const BotContext = createContext<BotContextValue | undefined>(undefined);

export function BotProvider({ children }: { children: ReactNode }) {
  const { isSignedIn, isLoaded } = useAuth();
  const [bots, setBots] = useState<BotWithSessions[]>([]);
  const [loadingBots, setLoadingBots] = useState(false);
  
  // Bot config cache using ref
  const botConfigCacheRef = useRef<Map<number, {
    temperature: number;
    system_prompt: string;
    behavior_rules: string[];
    lastUpdated: number;
  }>>(new Map());

  const loadBots = useCallback(async () => {
    if (!isSignedIn || !isLoaded) {
      setBots([]);
      return;
    }

    setLoadingBots(true);
    try {
      const data = await BotService.getAllBots();
      const botsWithSessions: BotWithSessions[] = data.map(bot => ({
        ...bot,
        sessions: undefined, // Will be loaded separately
      }));
      setBots(botsWithSessions);
      
      // Load sessions for all bots in parallel
      const sessionPromises = botsWithSessions.map(async (bot) => {
        try {
          const sessions = await ChatService.getSessions(bot.id);
          return { botId: bot.id, sessions };
        } catch (error) {
          console.error(`Failed to load sessions for bot ${bot.id}:`, error);
          return { botId: bot.id, sessions: [] };
        }
      });
      
      const sessionResults = await Promise.all(sessionPromises);
      setBots((prev) => 
        prev.map((bot) => {
          const sessionResult = sessionResults.find((r) => r.botId === bot.id);
          return {
            ...bot,
            sessions: sessionResult?.sessions || [],
          };
        })
      );
    } catch (error) {
      console.error('Failed to load bots:', error);
      setBots([]);
    } finally {
      setLoadingBots(false);
    }
  }, [isSignedIn, isLoaded]);

  const refreshBots = useCallback(async () => {
    await loadBots();
  }, [loadBots]);

  const getBot = useCallback((id: number): BotWithSessions | undefined => {
    return bots.find((bot) => bot.id === id);
  }, [bots]);

  const updateBot = useCallback((bot: Bot) => {
    setBots((prev) => prev.map((b) => (b.id === bot.id ? { ...b, ...bot } : b)));
  }, []);

  const addBot = useCallback((bot: Bot) => {
    setBots((prev) => {
      // Don't add if already exists
      if (prev.some((b) => b.id === bot.id)) {
        return prev.map((b) => (b.id === bot.id ? { ...b, ...bot } : b));
      }
      return [...prev, { ...bot, sessions: [] }];
    });
  }, []);

  const removeBot = useCallback((id: number) => {
    setBots((prev) => prev.filter((b) => b.id !== id));
    // Also invalidate related caches
    botConfigCacheRef.current.delete(id);
  }, []);

  const getBotSessions = useCallback((botId: number): Session[] | undefined => {
    const bot = bots.find((b) => b.id === botId);
    return bot?.sessions;
  }, [bots]);

  const refreshBotSessions = useCallback(async (botId: number) => {
    if (!isSignedIn || !isLoaded) return;
    
    try {
      const sessions = await ChatService.getSessions(botId);
      setBots((prev) =>
        prev.map((bot) => (bot.id === botId ? { ...bot, sessions } : bot))
      );
    } catch (error) {
      console.error(`Failed to refresh sessions for bot ${botId}:`, error);
    }
  }, [isSignedIn, isLoaded]);

  const addSessionToBot = useCallback((botId: number, session: Session) => {
    setBots((prev) =>
      prev.map((bot) =>
        bot.id === botId
          ? {
              ...bot,
              sessions: [session, ...(bot.sessions || [])],
            }
          : bot
      )
    );
  }, []);

  const removeSessionFromBot = useCallback((botId: number, sessionId: number) => {
    setBots((prev) =>
      prev.map((bot) =>
        bot.id === botId
          ? {
              ...bot,
              sessions: (bot.sessions || []).filter((s) => s.id !== sessionId),
            }
          : bot
      )
    );
  }, []);

  const getCachedBotConfig = useCallback((botId: number) => {
    const cached = botConfigCacheRef.current.get(botId);
    if (!cached) return null;
    return {
      temperature: cached.temperature,
      system_prompt: cached.system_prompt,
      behavior_rules: cached.behavior_rules,
    };
  }, []);

  const setCachedBotConfig = useCallback((botId: number, config: {
    temperature: number;
    system_prompt: string;
    behavior_rules: string[];
  }) => {
    botConfigCacheRef.current.set(botId, { ...config, lastUpdated: Date.now() });
  }, []);

  const invalidateBotConfigCache = useCallback((botId: number) => {
    botConfigCacheRef.current.delete(botId);
  }, []);

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

  const value: BotContextValue = {
    bots,
    loadingBots,
    refreshBots,
    getBot,
    updateBot,
    addBot,
    removeBot,
    getBotSessions,
    refreshBotSessions,
    addSessionToBot,
    removeSessionFromBot,
    getCachedBotConfig,
    setCachedBotConfig,
    invalidateBotConfigCache,
  };

  return <BotContext.Provider value={value}>{children}</BotContext.Provider>;
}

export function useBotContext() {
  const context = useContext(BotContext);
  if (context === undefined) {
    throw new Error('useBotContext must be used within a BotProvider');
  }
  return context;
}

// Convenience hooks
export function useBots() {
  const {
    bots,
    loadingBots,
    refreshBots,
    getBot,
    updateBot,
    addBot,
    removeBot,
    getBotSessions,
    refreshBotSessions,
    addSessionToBot,
    removeSessionFromBot,
    getCachedBotConfig,
    setCachedBotConfig,
    invalidateBotConfigCache,
  } = useBotContext();
  return {
    bots,
    loadingBots,
    refreshBots,
    getBot,
    updateBot,
    addBot,
    removeBot,
    getBotSessions,
    refreshBotSessions,
    addSessionToBot,
    removeSessionFromBot,
    getCachedBotConfig,
    setCachedBotConfig,
    invalidateBotConfigCache,
  };
}
