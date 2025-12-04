import type { GetAiRequestLogsParams } from '../../types/ai-request-log.types';

enum QueryKey {
  USER = 'user',
  USERS = 'users',
  SYSTEM = 'system',
  BEHAVIOR_RULES = 'behaviorRules',
  ME = 'me',
  ALL = 'all',
  AI_REQUEST_LOGS = 'aiRequestLogs',
}

export const queryKeys = {
  user: {
    all: [QueryKey.USER] as const,
    me: () => [...queryKeys.user.all, QueryKey.ME] as const,
    lists: () => [...queryKeys.user.all, QueryKey.USERS] as const,
    list: () => [...queryKeys.user.lists(), QueryKey.ALL] as const,
  },
  system: {
    all: [QueryKey.SYSTEM] as const,
    behaviorRules: () =>
      [...queryKeys.system.all, QueryKey.BEHAVIOR_RULES] as const,
  },
  aiRequestLogs: {
    all: [QueryKey.AI_REQUEST_LOGS] as const,
    lists: () => [...queryKeys.aiRequestLogs.all, QueryKey.ALL] as const,
    list: (params?: GetAiRequestLogsParams) =>
      [...queryKeys.aiRequestLogs.lists(), params] as const,
  },
} as const;
