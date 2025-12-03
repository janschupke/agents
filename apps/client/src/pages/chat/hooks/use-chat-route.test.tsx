import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { TestQueryProvider } from '../../../test/utils/test-query-provider';
import { AuthProvider } from '../../../contexts/AuthContext';
import { useChatRoute } from './use-chat-route';
import { AgentService } from '../../../services/agent/agent.service';
import { Agent } from '../../../types/chat.types';

// Mock Clerk
vi.mock('@clerk/clerk-react', () => ({
  useUser: vi.fn(() => ({
    isSignedIn: true,
    isLoaded: true,
  })),
}));

// Mock services
vi.mock('../../../services/chat/session/session.service', () => ({
  SessionService: {
    getSessionWithAgent: vi.fn(),
  },
}));

vi.mock('../../../services/agent/agent.service', () => ({
  AgentService: {
    getAllAgents: vi.fn(),
  },
}));

// Mock useSessionWithAgent
const mockUseSessionWithAgent = vi.fn();
vi.mock('./use-session-with-agent', () => ({
  useSessionWithAgent: (sessionId: number | null) =>
    mockUseSessionWithAgent(sessionId),
}));

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <TestQueryProvider>
    <AuthProvider>{children}</AuthProvider>
  </TestQueryProvider>
);

describe('useChatRoute', () => {
  const mockAgents: Agent[] = [
    {
      id: 1,
      name: 'Agent 1',
      description: 'Description 1',
      avatarUrl: null,
      createdAt: '2024-01-01T00:00:00.000Z',
    },
    {
      id: 2,
      name: 'Agent 2',
      description: 'Description 2',
      avatarUrl: null,
      createdAt: '2024-01-02T00:00:00.000Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
    vi.mocked(AgentService.getAllAgents).mockResolvedValue(mockAgents);
  });

  it('should return agentId from session when sessionId is provided', async () => {
    mockUseSessionWithAgent.mockReturnValue({
      agentId: 2,
      loading: false,
      error: null,
    });

    const { result } = renderHook(() => useChatRoute(null, 123), { wrapper });

    await waitFor(() => {
      expect(result.current.agentId).toBe(2);
      expect(result.current.sessionId).toBe(123);
      expect(result.current.loading).toBe(false);
    });
  });

  // Note: Agent fallback logic has been moved to ChatRoute.tsx
  // These tests are no longer relevant for useChatRoute hook

  it('should handle loading state from session', async () => {
    mockUseSessionWithAgent.mockReturnValue({
      agentId: null,
      loading: true,
      error: null,
    });

    const { result } = renderHook(() => useChatRoute(null, 123), { wrapper });

    expect(result.current.loading).toBe(true);
  });

  // Note: Agent loading logic has been moved to ChatRoute.tsx
  // This test is no longer relevant for useChatRoute hook

  it('should propagate error from session', async () => {
    mockUseSessionWithAgent.mockReturnValue({
      agentId: null,
      loading: false,
      error: 'Session not found',
    });

    const { result } = renderHook(() => useChatRoute(null, 123), { wrapper });

    await waitFor(() => {
      expect(result.current.error).toBe('Session not found');
    });
  });

  it('should parse sessionId correctly', async () => {
    mockUseSessionWithAgent.mockReturnValue({
      agentId: 1,
      loading: false,
      error: null,
    });

    const { result } = renderHook(() => useChatRoute(null, 456), { wrapper });

    await waitFor(() => {
      expect(result.current.sessionId).toBe(456);
    });
  });

  it('should handle null agentId and sessionId', async () => {
    mockUseSessionWithAgent.mockReturnValue({
      agentId: null,
      loading: false,
      error: null,
    });

    const { result } = renderHook(() => useChatRoute(null, null), { wrapper });

    await waitFor(() => {
      expect(result.current.sessionId).toBe(null);
      expect(result.current.agentId).toBe(null); // No agentId from session, and no agentId provided
    });
  });
});
