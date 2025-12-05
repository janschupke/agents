export const ROUTES = {
  USERS: '/users',
  USER_DETAIL: (id: string) => `/users/${id}`,
  USER_EDIT: (id: string) => `/users/${id}/edit`,
  SYSTEM_RULES: '/system-rules',
  AGENT_ARCHETYPES: '/agent-archetypes',
  AI_REQUEST_LOGS: '/ai-request-logs',
  AGENTS: '/agents',
  AGENT_DETAIL: (id: number) => `/agents/${id}`,
  AGENT_EDIT: (id: number) => `/agents/${id}/edit`,
} as const;
