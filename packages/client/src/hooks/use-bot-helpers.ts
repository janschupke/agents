import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './queries/query-keys';
import { Bot, Session } from '../types/chat.types';

/**
 * Helper hooks for bot operations using React Query cache
 * These replace the BotContext functionality
 */

/**
 * Get a bot by ID from React Query cache
 */
export function useGetBot() {
  const queryClient = useQueryClient();

  return (botId: number): Bot | undefined => {
    return queryClient.getQueryData<Bot>(queryKeys.bots.detail(botId));
  };
}

/**
 * Get bot sessions from React Query cache
 */
export function useGetBotSessions() {
  const queryClient = useQueryClient();

  return (botId: number): Session[] | undefined => {
    return queryClient.getQueryData<Session[]>(queryKeys.bots.sessions(botId));
  };
}

/**
 * Helper to invalidate bot-related queries
 */
export function useInvalidateBot() {
  const queryClient = useQueryClient();

  return {
    invalidateBot: (botId: number) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bots.detail(botId) });
    },
    invalidateBotList: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bots.all });
    },
    invalidateBotSessions: (botId: number) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bots.sessions(botId) });
    },
    invalidateAll: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bots.all });
    },
  };
}

/**
 * Helper to optimistically update bot in cache
 */
export function useUpdateBotCache() {
  const queryClient = useQueryClient();

  return (bot: Bot) => {
    queryClient.setQueryData(queryKeys.bots.detail(bot.id), bot);
    queryClient.invalidateQueries({ queryKey: queryKeys.bots.all });
  };
}

/**
 * Helper to optimistically update bot sessions in cache
 */
export function useUpdateBotSessionsCache() {
  const queryClient = useQueryClient();

  return {
    addSession: (botId: number, session: Session) => {
      const currentSessions = queryClient.getQueryData<Session[]>(queryKeys.bots.sessions(botId)) || [];
      queryClient.setQueryData(queryKeys.bots.sessions(botId), [session, ...currentSessions]);
    },
    removeSession: (botId: number, sessionId: number) => {
      const currentSessions = queryClient.getQueryData<Session[]>(queryKeys.bots.sessions(botId)) || [];
      queryClient.setQueryData(
        queryKeys.bots.sessions(botId),
        currentSessions.filter((s) => s.id !== sessionId)
      );
    },
  };
}
