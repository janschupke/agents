export const ROUTES = {
  ROOT: '/',
  CHAT: '/chat',
  // Navigation functions (used with actual values)
  CHAT_AGENT: (agentId: number) => `/chat/${agentId}`,
  CHAT_SESSION: (agentId: number, sessionId: number) => `/chat/${agentId}/${sessionId}`,
  CONFIG: '/config',
  CONFIG_NEW: '/config/new',
  CONFIG_AGENT: (agentId: number) => `/config/${agentId}`,
  PROFILE: '/profile',
  
  // Route patterns for React Router (with :paramName syntax)
  CHAT_AGENT_PATTERN: '/chat/:agentId',
  CHAT_SESSION_PATTERN: '/chat/:agentId/:sessionId',
  CONFIG_AGENT_PATTERN: '/config/:agentId',
} as const;

// Helper to check if route matches pattern
export const isChatRoute = (path: string) => path.startsWith('/chat');
export const isConfigRoute = (path: string) => path.startsWith('/config');
