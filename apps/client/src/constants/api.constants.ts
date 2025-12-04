export const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const API_ENDPOINTS = {
  CHAT: {
    BY_AGENT: (agentId: number, sessionId?: number) => {
      const base = `/api/chat/${agentId}`;
      const params = new URLSearchParams();
      if (sessionId) params.append('sessionId', String(sessionId));
      const queryString = params.toString();
      return queryString ? `${base}?${queryString}` : base;
    },
    SESSIONS: (agentId: number) => `/api/chat/${agentId}/sessions`,
    SESSION: (agentId: number, sessionId: number) =>
      `/api/chat/${agentId}/sessions/${sessionId}`,
  },
  AGENTS: {
    BASE: '/api/agents',
    BY_ID: (agentId: number) => `/api/agents/${agentId}`,
    MEMORIES: (agentId: number) => `/api/agents/${agentId}/memories`,
    MEMORY: (agentId: number, memoryId: number) =>
      `/api/agents/${agentId}/memories/${memoryId}`,
    MEMORIES_SUMMARIZE: (agentId: number) =>
      `/api/agents/${agentId}/memories/summarize`,
  },
  MESSAGES: {
    TRANSLATE: (messageId: number) => `/api/messages/${messageId}/translate`,
    TRANSLATE_WITH_WORDS: (messageId: number) =>
      `/api/messages/${messageId}/translate-with-words`,
    WORD_TRANSLATIONS: (messageId: number) =>
      `/api/messages/${messageId}/word-translations`,
    TRANSLATE_WORDS: (messageId: number) =>
      `/api/messages/${messageId}/words/translate`,
    TRANSLATIONS: (messageIds: number[]) =>
      `/api/messages/translations?messageIds=${messageIds.join(',')}`,
  },
  USER: {
    ME: '/api/user/me',
  },
  API_CREDENTIALS: {
    OPENAI: '/api/api-credentials/openai',
    OPENAI_CHECK: '/api/api-credentials/openai/check',
  },
  SESSIONS: {
    BY_ID: (sessionId: number) => `/api/sessions/${sessionId}`,
  },
  SAVED_WORDS: {
    BASE: '/api/saved-words',
    BY_LANGUAGE: (language: string) => `/api/saved-words?language=${language}`,
    MATCHING: (words: string[]) =>
      `/api/saved-words/matching?words=${words.join(',')}`,
    BY_ID: (id: number) => `/api/saved-words/${id}`,
    SENTENCES: (id: number) => `/api/saved-words/${id}/sentences`,
    SENTENCE: (id: number, sentenceId: number) =>
      `/api/saved-words/${id}/sentences/${sentenceId}`,
  },
  AGENT_ARCHETYPES: {
    BASE: '/api/agent-archetypes',
    BY_ID: (id: number) => `/api/agent-archetypes/${id}`,
  },
} as const;
