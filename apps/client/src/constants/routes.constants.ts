export const ROUTES = {
  ROOT: '/',
  CHAT: '/chat',
  // Navigation functions (used with actual values)
  CHAT_AGENT: (agentId: number) => `/chat/${agentId}`,
  CONFIG: '/config',
  CONFIG_NEW: '/config/new',
  CONFIG_AGENT: (agentId: number) => `/config/${agentId}`,
  PROFILE: '/profile',
  SAVED_WORDS: '/saved-words',
  FLASHCARDS: '/flashcards',

  // Route patterns for React Router (with :paramName syntax)
  CHAT_AGENT_PATTERN: '/chat/:agentId',
  CONFIG_AGENT_PATTERN: '/config/:agentId',
} as const;

// Helper to check if route matches pattern
const isChatRoute = (path: string) => path.startsWith('/chat');
const isConfigRoute = (path: string) => path.startsWith('/config');
