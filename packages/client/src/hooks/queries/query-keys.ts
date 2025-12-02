export enum QueryKey {
  BOTS = 'bots',
  CHAT = 'chat',
  USER = 'user',
  CONFIG = 'config',
  LIST = 'list',
  DETAIL = 'detail',
  SESSIONS = 'sessions',
  HISTORY = 'history',
  MEMORIES = 'memories',
  ME = 'me',
  API_KEY = 'apiKey',
  SYSTEM = 'system',
}

export const queryKeys = {
  bots: {
    all: [QueryKey.BOTS] as const,
    lists: () => [...queryKeys.bots.all, QueryKey.LIST] as const,
    list: (filters?: string) => [...queryKeys.bots.lists(), { filters }] as const,
    details: () => [...queryKeys.bots.all, QueryKey.DETAIL] as const,
    detail: (id: number) => [...queryKeys.bots.details(), id] as const,
    sessions: (botId: number) => [...queryKeys.bots.detail(botId), QueryKey.SESSIONS] as const,
    config: (botId: number) => [...queryKeys.bots.detail(botId), QueryKey.CONFIG] as const,
    memories: (botId: number) => [...queryKeys.bots.detail(botId), QueryKey.MEMORIES] as const,
  },
  chat: {
    all: [QueryKey.CHAT] as const,
    history: (botId: number, sessionId?: number) =>
      [...queryKeys.chat.all, QueryKey.HISTORY, botId, sessionId] as const,
    sessions: (botId: number) => [...queryKeys.chat.all, QueryKey.SESSIONS, botId] as const,
  },
  user: {
    all: [QueryKey.USER] as const,
    me: () => [...queryKeys.user.all, QueryKey.ME] as const,
    apiKey: () => [...queryKeys.user.all, QueryKey.API_KEY] as const,
  },
  config: {
    all: [QueryKey.CONFIG] as const,
    system: () => [...queryKeys.config.all, QueryKey.SYSTEM] as const,
  },
} as const;


