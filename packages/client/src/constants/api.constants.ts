export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const API_ENDPOINTS = {
  CHAT: (botId: number, sessionId?: number) => {
    const base = `/api/chat/${botId}`;
    return sessionId ? `${base}?sessionId=${sessionId}` : base;
  },
  SESSIONS: (botId: number) => `/api/chat/${botId}/sessions`,
  BOTS: '/api/bots',
  BOT: (botId: number) => `/api/bots/${botId}`,
  BOT_EMBEDDINGS: (botId: number) => `/api/bots/${botId}/embeddings`,
  BOT_EMBEDDING: (botId: number, embeddingId: number) =>
    `/api/bots/${botId}/embeddings/${embeddingId}`,
  USER_ME: '/api/user/me',
  HEALTHCHECK: '/api/healthcheck',
  API_CREDENTIALS_STATUS: '/api/api-credentials/status',
  API_CREDENTIALS_OPENAI: '/api/api-credentials/openai',
  API_CREDENTIALS_OPENAI_CHECK: '/api/api-credentials/openai/check',
} as const;
