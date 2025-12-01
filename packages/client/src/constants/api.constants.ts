export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const API_ENDPOINTS = {
  CHAT: (botId: number, sessionId?: number) => {
    const base = `/api/chat/${botId}`;
    return sessionId ? `${base}?sessionId=${sessionId}` : base;
  },
  SESSIONS: (botId: number) => `/api/chat/${botId}/sessions`,
  SESSION: (botId: number, sessionId: number) => `/api/chat/${botId}/sessions/${sessionId}`,
  BOTS: '/api/bots',
  BOT: (botId: number) => `/api/bots/${botId}`,
  BOT_MEMORIES: (botId: number) => `/api/bots/${botId}/memories`,
  BOT_MEMORY: (botId: number, memoryId: number) =>
    `/api/bots/${botId}/memories/${memoryId}`,
  BOT_MEMORIES_SUMMARIZE: (botId: number) =>
    `/api/bots/${botId}/memories/summarize`,
  USER_ME: '/api/user/me',
  API_CREDENTIALS_OPENAI: '/api/api-credentials/openai',
  API_CREDENTIALS_OPENAI_CHECK: '/api/api-credentials/openai/check',
} as const;
