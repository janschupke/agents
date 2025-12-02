export const ROUTES = {
  ROOT: '/',
  CHAT: '/chat',
  CHAT_SESSION: (sessionId: number) => `/chat/${sessionId}`,
  CONFIG: '/config',
  CONFIG_NEW: '/config/new',
  CONFIG_AGENT: (agentId: number) => `/config/${agentId}`,
  PROFILE: '/profile',
} as const;

// Helper to check if route matches pattern
export const isChatRoute = (path: string) => path.startsWith('/chat');
export const isConfigRoute = (path: string) => path.startsWith('/config');
