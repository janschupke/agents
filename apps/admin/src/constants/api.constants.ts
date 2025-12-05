export const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const API_ENDPOINTS = {
  USER_ME: '/api/user/me',
  USER_ALL: '/api/user/all',
  HEALTHCHECK: '/api/healthcheck',
  SYSTEM_CONFIG_BEHAVIOR_RULES: '/api/system-config/behavior-rules',
  AGENT_ARCHETYPES: {
    BASE: '/api/agent-archetypes',
    BY_ID: (id: number) => `/api/agent-archetypes/${id}`,
  },
  AI_REQUEST_LOGS: '/api/ai-request-logs',
  ADMIN_AGENTS: {
    BASE: '/api/admin/agents',
    BY_ID: (id: number) => `/api/admin/agents/${id}`,
    MEMORIES: (id: number) => `/api/admin/agents/${id}/memories`,
    MEMORY: (id: number, memoryId: number) =>
      `/api/admin/agents/${id}/memories/${memoryId}`,
  },
} as const;
