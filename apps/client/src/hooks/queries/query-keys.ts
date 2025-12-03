enum QueryKey {
  AGENTS = 'agents',
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
  SAVED_WORDS = 'savedWords',
  MATCHING = 'matching',
}

export const queryKeys = {
  agents: {
    all: [QueryKey.AGENTS] as const,
    lists: () => [...queryKeys.agents.all, QueryKey.LIST] as const,
    list: (filters?: string) =>
      [...queryKeys.agents.lists(), { filters }] as const,
    details: () => [...queryKeys.agents.all, QueryKey.DETAIL] as const,
    detail: (id: number) => [...queryKeys.agents.details(), id] as const,
    sessions: (agentId: number) =>
      [...queryKeys.agents.detail(agentId), QueryKey.SESSIONS] as const,
    config: (agentId: number) =>
      [...queryKeys.agents.detail(agentId), QueryKey.CONFIG] as const,
    memories: (agentId: number) =>
      [...queryKeys.agents.detail(agentId), QueryKey.MEMORIES] as const,
  },
  chat: {
    all: [QueryKey.CHAT] as const,
    history: (agentId: number, sessionId?: number) =>
      [...queryKeys.chat.all, QueryKey.HISTORY, agentId, sessionId] as const,
    sessions: (agentId: number) =>
      [...queryKeys.chat.all, QueryKey.SESSIONS, agentId] as const,
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
  sessions: {
    all: [QueryKey.SESSIONS] as const,
    withAgent: (sessionId: number) =>
      [...queryKeys.sessions.all, 'with-agent', sessionId] as const,
  },
  savedWords: {
    all: () => [QueryKey.SAVED_WORDS] as const,
    details: () => [...queryKeys.savedWords.all(), QueryKey.DETAIL] as const,
    detail: (id: number) => [...queryKeys.savedWords.details(), id] as const,
    matching: (words: string[]) =>
      [
        ...queryKeys.savedWords.all(),
        QueryKey.MATCHING,
        words.sort().join(','),
      ] as const,
    matchingPrefix: () =>
      [...queryKeys.savedWords.all(), QueryKey.MATCHING] as const,
  },
} as const;
