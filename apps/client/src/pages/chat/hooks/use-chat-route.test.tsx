import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { TestQueryProvider } from '../../../test/utils/test-query-provider';
import { AuthProvider } from '../../../contexts/AuthContext';
import { useChatRoute } from './use-chat-route';
import { AgentService } from '../../../services/agent.service';
import { Agent } from '../../../types/chat.types';

// Mock Clerk
vi.mock('@clerk/clerk-react', () => ({
  useUser: vi.fn(() => ({
    isSignedIn: true,
    isLoaded: true,
  })),
}));

// Mock services
vi.mock('../../../services/chat.service', () => ({
  ChatService: {
    getSessionWithAgent: vi.fn(),
  },
}));

vi.mock('../../../services/agent.service', () => ({
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

    const { result } = renderHook(() => useChatRoute('123'), { wrapper });

    await waitFor(() => {
      expect(result.current.agentId).toBe(2);
      expect(result.current.sessionId).toBe(123);
      expect(result.current.loading).toBe(false);
    });
  });

  it('should fall back to last selected agent when no sessionId', async () => {
    mockUseSessionWithAgent.mockReturnValue({
      agentId: null,
      loading: false,
      error: null,
    });
    mockLocalStorage.getItem.mockReturnValue('2'); // Last selected agent ID

    const { result } = renderHook(() => useChatRoute(undefined), { wrapper });

    await waitFor(() => {
      expect(result.current.agentId).toBe(2);
      expect(result.current.sessionId).toBe(null);
    });
  });

  it('should fall back to first available agent when no sessionId and no last selected', async () => {
    mockUseSessionWithAgent.mockReturnValue({
      agentId: null,
      loading: false,
      error: null,
    });
    mockLocalStorage.getItem.mockReturnValue(null); // No last selected

    const { result } = renderHook(() => useChatRoute(undefined), { wrapper });

    await waitFor(() => {
      expect(result.current.agentId).toBe(1); // First agent
      expect(result.current.sessionId).toBe(null);
    });

    // Should save first agent to localStorage
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'selectedAgentId_chat',
      '1'
    );
  });

  it('should use first available agent when last selected agent no longer exists', async () => {
    mockUseSessionWithAgent.mockReturnValue({
      agentId: null,
      loading: false,
      error: null,
    });
    mockLocalStorage.getItem.mockReturnValue('999'); // Last selected agent that doesn't exist

    const { result } = renderHook(() => useChatRoute(undefined), { wrapper });

    await waitFor(() => {
      expect(result.current.agentId).toBe(1); // First available agent
      expect(result.current.sessionId).toBe(null);
    });

    // Should update localStorage with first available agent
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'selectedAgentId_chat',
      '1'
    );
  });

  it('should return null agentId when no agents exist and no sessionId', async () => {
    mockUseSessionWithAgent.mockReturnValue({
      agentId: null,
      loading: false,
      error: null,
    });
    vi.mocked(AgentService.getAllAgents).mockResolvedValue([]);

    const { result } = renderHook(() => useChatRoute(undefined), { wrapper });

    await waitFor(() => {
      expect(result.current.agentId).toBe(null);
      expect(result.current.sessionId).toBe(null);
    });
  });

  it('should handle loading state from session', async () => {
    mockUseSessionWithAgent.mockReturnValue({
      agentId: null,
      loading: true,
      error: null,
    });

    const { result } = renderHook(() => useChatRoute('123'), { wrapper });

    expect(result.current.loading).toBe(true);
  });

  it('should handle loading state from agents when no sessionId', async () => {
    mockUseSessionWithAgent.mockReturnValue({
      agentId: null,
      loading: false,
      error: null,
    });

    // Mock useAgents to return loading state
    vi.mocked(AgentService.getAllAgents).mockImplementation(
      () =>
        new Promise(() => {
          // Never resolves - simulates loading
        })
    );

    const { result } = renderHook(() => useChatRoute(undefined), { wrapper });

    // Should be loading while agents are being fetched
    expect(result.current.loading).toBe(true);
  });

  it('should propagate error from session', async () => {
    mockUseSessionWithAgent.mockReturnValue({
      agentId: null,
      loading: false,
      error: 'Session not found',
    });

    const { result } = renderHook(() => useChatRoute('123'), { wrapper });

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

    const { result } = renderHook(() => useChatRoute('456'), { wrapper });

    await waitFor(() => {
      expect(result.current.sessionId).toBe(456);
    });
  });

  it('should handle invalid sessionId string', async () => {
    mockUseSessionWithAgent.mockReturnValue({
      agentId: null,
      loading: false,
      error: null,
    });

    const { result } = renderHook(() => useChatRoute('invalid'), { wrapper });

    await waitFor(() => {
      expect(result.current.sessionId).toBe(null);
      // Should fall back to agents
      expect(result.current.agentId).toBe(1);
    });
  });
});
