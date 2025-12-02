/**
 * Centralized API route constants for backend controllers
 */

export const API_ROUTES = {
  PREFIX: 'api',
  
  CHAT: {
    BASE: 'api/chat',
    BY_BOT: (botId: number) => `api/chat/${botId}`,
    SESSIONS: (botId: number) => `api/chat/${botId}/sessions`,
    SESSION: (botId: number, sessionId: number) => `api/chat/${botId}/sessions/${sessionId}`,
  },

  BOTS: {
    BASE: 'api/bots',
    BY_ID: (botId: number) => `api/bots/${botId}`,
    MEMORIES: (botId: number) => `api/bots/${botId}/memories`,
    MEMORY: (botId: number, memoryId: number) => `api/bots/${botId}/memories/${memoryId}`,
    MEMORIES_SUMMARIZE: (botId: number) => `api/bots/${botId}/memories/summarize`,
  },

  MESSAGES: {
    BASE: 'api/messages',
    TRANSLATE: (messageId: number) => `api/messages/${messageId}/translate`,
    TRANSLATE_WITH_WORDS: (messageId: number) => `api/messages/${messageId}/translate-with-words`,
    WORD_TRANSLATIONS: (messageId: number) => `api/messages/${messageId}/word-translations`,
    TRANSLATIONS: 'api/messages/translations',
  },

  USER: {
    BASE: 'api/user',
    ME: 'api/user/me',
    ALL: 'api/user/all',
  },

  SYSTEM_CONFIG: {
    BASE: 'api/system-config',
    BEHAVIOR_RULES: 'api/system-config/behavior-rules',
  },

  API_CREDENTIALS: {
    BASE: 'api/api-credentials',
    OPENAI: 'api/api-credentials/openai',
    OPENAI_CHECK: 'api/api-credentials/openai/check',
  },

  WEBHOOKS: {
    BASE: 'api/webhooks',
    CLERK: 'api/webhooks/clerk',
  },

  HEALTHCHECK: {
    BASE: 'api/healthcheck',
  },
} as const;


