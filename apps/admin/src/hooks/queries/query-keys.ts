import type { GetAiRequestLogsParams } from '../../types/ai-request-log.types';

enum QueryKey {
  USER = 'user',
  USERS = 'users',
  SYSTEM = 'system',
  BEHAVIOR_RULES = 'behaviorRules',
  ME = 'me',
  ALL = 'all',
  AI_REQUEST_LOGS = 'aiRequestLogs',
  AGENT = 'admin-agent',
  AGENTS = 'admin-agents',
  AGENT_MEMORIES = 'admin-agent-memories',
  ARCHETYPE = 'agent-archetype',
  ARCHETYPES = 'agent-archetypes',
  MEMORIES = 'memories',
}

export const queryKeys = {
  user: {
    all: [QueryKey.USER] as const,
    me: () => [...queryKeys.user.all, QueryKey.ME] as const,
    lists: () => [...queryKeys.user.all, QueryKey.USERS] as const,
    list: () => [...queryKeys.user.lists(), QueryKey.ALL] as const,
    detail: (id: string) => [...queryKeys.user.all, id] as const,
  },
  system: {
    all: [QueryKey.SYSTEM] as const,
    behaviorRules: () => (agentType?: string | null) =>
      [
        ...queryKeys.system.all,
        QueryKey.BEHAVIOR_RULES,
        agentType || 'main',
      ] as const,
  },
  aiRequestLogs: {
    all: [QueryKey.AI_REQUEST_LOGS] as const,
    lists: () => [...queryKeys.aiRequestLogs.all, QueryKey.ALL] as const,
    list: (params?: GetAiRequestLogsParams) =>
      [...queryKeys.aiRequestLogs.lists(), params] as const,
  },
  agent: {
    all: [QueryKey.AGENT] as const,
    lists: () => [...queryKeys.agent.all, QueryKey.AGENTS] as const,
    list: () => [...queryKeys.agent.lists(), QueryKey.ALL] as const,
    detail: (id: number) => [...queryKeys.agent.all, id] as const,
    memories: (id: number) =>
      [...queryKeys.agent.detail(id), QueryKey.MEMORIES] as const,
  },
  archetype: {
    all: [QueryKey.ARCHETYPE] as const,
    lists: () => [...queryKeys.archetype.all, QueryKey.ARCHETYPES] as const,
    list: () => [...queryKeys.archetype.lists(), QueryKey.ALL] as const,
    detail: (id: number) => [...queryKeys.archetype.all, id] as const,
  },
} as const;
