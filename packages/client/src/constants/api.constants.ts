export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const API_ENDPOINTS = {
  CHAT: {
    BY_BOT: (botId: number, sessionId?: number) => {
      const base = `/api/chat/${botId}`;
      return sessionId ? `${base}?sessionId=${sessionId}` : base;
    },
    SESSIONS: (botId: number) => `/api/chat/${botId}/sessions`,
    SESSION: (botId: number, sessionId: number) => `/api/chat/${botId}/sessions/${sessionId}`,
  },
  BOTS: {
    BASE: '/api/bots',
    BY_ID: (botId: number) => `/api/bots/${botId}`,
    MEMORIES: (botId: number) => `/api/bots/${botId}/memories`,
    MEMORY: (botId: number, memoryId: number) => `/api/bots/${botId}/memories/${memoryId}`,
    MEMORIES_SUMMARIZE: (botId: number) => `/api/bots/${botId}/memories/summarize`,
  },
  MESSAGES: {
    TRANSLATE: (messageId: number) => `/api/messages/${messageId}/translate`,
    TRANSLATE_WITH_WORDS: (messageId: number) => `/api/messages/${messageId}/translate-with-words`,
    WORD_TRANSLATIONS: (messageId: number) => `/api/messages/${messageId}/word-translations`,
    TRANSLATIONS: (messageIds: number[]) => `/api/messages/translations?messageIds=${messageIds.join(',')}`,
  },
  USER: {
    ME: '/api/user/me',
  },
  API_CREDENTIALS: {
    OPENAI: '/api/api-credentials/openai',
    OPENAI_CHECK: '/api/api-credentials/openai/check',
  },
} as const;
