enum QueryKey {
  USER = 'user',
  USERS = 'users',
  SYSTEM = 'system',
  BEHAVIOR_RULES = 'behaviorRules',
  ME = 'me',
  ALL = 'all',
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
} as const;
