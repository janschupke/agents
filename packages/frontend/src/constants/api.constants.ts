export const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const API_ENDPOINTS = {
  CHAT: (botId: number, sessionId?: number) => {
    const base = `/api/chat/${botId}`;
    return sessionId ? `${base}?sessionId=${sessionId}` : base;
  },
  SESSIONS: (botId: number) => `/api/chat/${botId}/sessions`,
  HEALTHCHECK: '/api/healthcheck',
} as const;
