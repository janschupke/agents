/**
 * Centralized API route constants for backend controllers
 */

export const API_ROUTES = {
  PREFIX: 'api',

  CHAT: {
    BASE: 'api/chat',
    BY_AGENT: (agentId: number) => `api/chat/${agentId}`,
    SESSIONS: (agentId: number) => `api/chat/${agentId}/sessions`,
    SESSION: (agentId: number, sessionId: number) =>
      `api/chat/${agentId}/sessions/${sessionId}`,
  },

  SESSIONS: {
    BASE: 'api/sessions',
    BY_ID: (sessionId: number) => `api/sessions/${sessionId}`,
  },

  AGENTS: {
    BASE: 'api/agents',
    BY_ID: (agentId: number) => `api/agents/${agentId}`,
    MEMORIES: (agentId: number) => `api/agents/${agentId}/memories`,
    MEMORY: (agentId: number, memoryId: number) =>
      `api/agents/${agentId}/memories/${memoryId}`,
    MEMORIES_SUMMARIZE: (agentId: number) =>
      `api/agents/${agentId}/memories/summarize`,
  },

  MESSAGES: {
    BASE: 'api/messages',
    TRANSLATE: (messageId: number) => `api/messages/${messageId}/translate`,
    TRANSLATE_WITH_WORDS: (messageId: number) =>
      `api/messages/${messageId}/translate-with-words`,
    WORD_TRANSLATIONS: (messageId: number) =>
      `api/messages/${messageId}/word-translations`,
    TRANSLATE_WORDS: (messageId: number) =>
      `api/messages/${messageId}/words/translate`,
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

  SAVED_WORDS: {
    BASE: 'api/saved-words',
    MATCHING: 'api/saved-words/matching',
    BY_ID: (id: number) => `api/saved-words/${id}`,
    SENTENCES: (id: number) => `api/saved-words/${id}/sentences`,
    SENTENCE: (id: number, sentenceId: number) =>
      `api/saved-words/${id}/sentences/${sentenceId}`,
  },

  AGENT_ARCHETYPES: {
    BASE: 'api/agent-archetypes',
    BY_ID: (id: number) => `api/agent-archetypes/${id}`,
  },

  AI_REQUEST_LOGS: {
    BASE: 'api/ai-request-logs',
  },

  ADMIN: {
    AGENTS: {
      BASE: 'api/admin/agents',
      BY_ID: (id: number) => `api/admin/agents/${id}`,
      MEMORIES: (id: number) => `api/admin/agents/${id}/memories`,
      MEMORY: (id: number, memoryId: number) =>
        `api/admin/agents/${id}/memories/${memoryId}`,
    },
  },
} as const;
