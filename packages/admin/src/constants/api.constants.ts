export const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const API_ENDPOINTS = {
  USER_ME: '/api/user/me',
  USER_ALL: '/api/user/all',
  HEALTHCHECK: '/api/healthcheck',
  SYSTEM_CONFIG_BEHAVIOR_RULES: '/api/system-config/behavior-rules',
} as const;
