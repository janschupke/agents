import { createContext, useContext, ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useBots as useBotsQuery } from '../hooks/queries/use-bots';
import { queryKeys } from '../hooks/queries/query-keys';
import { Bot, Session } from '../types/chat.types';

interface BotContextValue {
  // Bots data
  bots: Bot[];
  loadingBots: boolean;
  refreshBots: () => Promise<void>;
  getBot: (id: number) => Bot | undefined;
  updateBot: (bot: Bot) => void;
  addBot: (bot: Bot) => void;
  removeBot: (id: number) => void;

  // Sessions for a specific bot
  getBotSessions: (botId: number) => Session[] | undefined;
  refreshBotSessions: (botId: number) => Promise<void>;
  addSessionToBot: (botId: number, session: Session) => void;
  removeSessionFromBot: (botId: number, sessionId: number) => void;

  // Bot config cache (deprecated - use React Query cache instead)
  getCachedBotConfig: (botId: number) => {
    temperature: number;
    system_prompt: string;
    behavior_rules: string[];
  } | null;
  setCachedBotConfig: (
    botId: number,
    config: {
      temperature: number;
      system_prompt: string;
      behavior_rules: string[];
    }
  ) => void;
  invalidateBotConfigCache: (botId: number) => void;
}

const BotContext = createContext<BotContextValue | undefined>(undefined);

export function BotProvider({ children }: { children: ReactNode }) {
  const { data: bots = [], isLoading: loadingBots, refetch: refetchBots } = useBotsQuery();
  const queryClient = useQueryClient();

  const refreshBots = async () => {
    await refetchBots();
  };

  const getBot = (id: number): Bot | undefined => {
    return bots.find((bot) => bot.id === id);
  };

  const updateBot = (bot: Bot) => {
    // Optimistic update - React Query will refetch and update
    queryClient.setQueryData(queryKeys.bots.detail(bot.id), bot);
    queryClient.invalidateQueries({ queryKey: queryKeys.bots.all });
  };

  const addBot = (bot: Bot) => {
    // Optimistic update
    queryClient.setQueryData(queryKeys.bots.detail(bot.id), bot);
    queryClient.invalidateQueries({ queryKey: queryKeys.bots.all });
  };

  const removeBot = (id: number) => {
    queryClient.removeQueries({ queryKey: queryKeys.bots.detail(id) });
    queryClient.invalidateQueries({ queryKey: queryKeys.bots.all });
  };

  const getBotSessions = (botId: number): Session[] | undefined => {
    return queryClient.getQueryData<Session[]>(queryKeys.bots.sessions(botId));
  };

  const refreshBotSessions = async (botId: number) => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.bots.sessions(botId) });
  };

  const addSessionToBot = (botId: number, session: Session) => {
    const currentSessions = queryClient.getQueryData<Session[]>(queryKeys.bots.sessions(botId)) || [];
    queryClient.setQueryData(queryKeys.bots.sessions(botId), [session, ...currentSessions]);
  };

  const removeSessionFromBot = (botId: number, sessionId: number) => {
    const currentSessions = queryClient.getQueryData<Session[]>(queryKeys.bots.sessions(botId)) || [];
    queryClient.setQueryData(
      queryKeys.bots.sessions(botId),
      currentSessions.filter((s) => s.id !== sessionId)
    );
  };

  // Deprecated: Bot config cache - use React Query cache instead
  const getCachedBotConfig = (botId: number) => {
    const bot = queryClient.getQueryData<Bot>(queryKeys.bots.detail(botId));
    if (bot?.configs) {
      const config = bot.configs;
      return {
        temperature: typeof config.temperature === 'number' ? config.temperature : 0.7,
        system_prompt: typeof config.system_prompt === 'string' ? config.system_prompt : '',
        behavior_rules: Array.isArray(config.behavior_rules)
          ? config.behavior_rules.map(String)
          : typeof config.behavior_rules === 'string'
          ? JSON.parse(config.behavior_rules).map(String)
          : [],
      };
    }
    return null;
  };

  const setCachedBotConfig = () => {
    // Deprecated - config is now part of bot data in React Query cache
  };

  const invalidateBotConfigCache = (botId: number) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.bots.detail(botId) });
  };

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
  return useBotContext();
}
