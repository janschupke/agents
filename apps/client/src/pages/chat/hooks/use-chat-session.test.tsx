import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useChatSession } from './use-chat-session';
import { TestQueryProvider } from '../../../test/utils/test-query-provider';
import { Session } from '../../../types/chat.types';

// Mock dependencies
const mockUseAgentSessions = vi.fn();
const mockCreateSession = vi.fn();
const mockDeleteSession = vi.fn();
const mockFetchQuery = vi.fn();
const mockPrefetchQuery = vi.fn();
const mockInvalidateQueries = vi.fn();

vi.mock('../../../hooks/queries/use-agents', () => ({
  useAgentSessions: (agentId: number | null) => mockUseAgentSessions(agentId),
}));

vi.mock('../../../hooks/mutations/use-agent-mutations', () => ({
  useCreateSession: () => ({
    mutateAsync: mockCreateSession,
  }),
  useDeleteSession: () => ({
    mutateAsync: mockDeleteSession,
  }),
}));

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual<typeof import('@tanstack/react-query')>(
    '@tanstack/react-query'
  );
  return {
    ...actual,
    useQueryClient: () => ({
      fetchQuery: mockFetchQuery,
      prefetchQuery: mockPrefetchQuery,
      invalidateQueries: mockInvalidateQueries,
      getQueryData: vi.fn(() => undefined),
    }),
  };
});

vi.mock('../../../services/chat/message/message.service', () => ({
  MessageService: {
    getChatHistory: vi.fn(),
  },
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <TestQueryProvider>{children}</TestQueryProvider>
);

describe('useChatSession', () => {
  const mockSessions: Session[] = [
    {
      id: 1,
      session_name: 'Session 1',
      createdAt: '2024-01-01T00:00:00.000Z',
    },
    {
      id: 2,
      session_name: 'Session 2',
      createdAt: '2024-01-02T00:00:00.000Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAgentSessions.mockReturnValue({
      data: [],
      isLoading: false,
    });
  });

  it('should initialize with initialSessionId', () => {
    const { result } = renderHook(
      () => useChatSession({ agentId: 1, initialSessionId: 2 }),
      { wrapper }
    );

    expect(result.current.currentSessionId).toBe(2);
  });

  // Note: Auto-selection logic has been moved to ChatRoute.tsx
  // This test is no longer relevant for useChatSession hook
  it('should initialize with null sessionId when no initialSessionId', () => {
    mockUseAgentSessions.mockReturnValue({
      data: mockSessions,
      isLoading: false,
    });

    const { result } = renderHook(() => useChatSession({ agentId: 1 }), {
      wrapper,
    });

    // Should start with null (no auto-selection in hook)
    expect(result.current.currentSessionId).toBeNull();
  });

  it('should create new session', async () => {
    const newSession: Session = {
      id: 3,
      session_name: null,
      createdAt: '2024-01-03T00:00:00.000Z',
    };

    mockCreateSession.mockResolvedValue(newSession);
    mockUseAgentSessions.mockReturnValue({
      data: mockSessions,
      isLoading: false,
    });

    const { result } = renderHook(() => useChatSession({ agentId: 1 }), {
      wrapper,
    });

    let createdSession;
    await act(async () => {
      createdSession = await result.current.handleNewSession();
    });

    expect(mockCreateSession).toHaveBeenCalledWith(1);
    expect(createdSession).toEqual(newSession);
    expect(result.current.currentSessionId).toBe(3);
  });

  it('should select session and load history', async () => {
    const mockHistory = {
      agent: { id: 1, name: 'Agent' },
      session: { id: 2, session_name: 'Session' },
      messages: [],
    };

    mockFetchQuery.mockResolvedValue(mockHistory);
    mockUseAgentSessions.mockReturnValue({
      data: mockSessions,
      isLoading: false,
    });

    const { result } = renderHook(() => useChatSession({ agentId: 1 }), {
      wrapper,
    });

    let history;
    await act(async () => {
      history = await result.current.handleSessionSelect(2);
    });

    expect(result.current.currentSessionId).toBe(2);
    expect(history).toEqual(mockHistory);
  });

  it('should delete session', async () => {
    const mockOnConfirm = vi.fn().mockResolvedValue(true);
    mockDeleteSession.mockResolvedValue(undefined);
    mockUseAgentSessions.mockReturnValue({
      data: mockSessions,
      isLoading: false,
    });

    const { result } = renderHook(
      () => useChatSession({ agentId: 1, initialSessionId: 1 }),
      { wrapper }
    );

    await act(async () => {
      await result.current.handleSessionDelete(1, mockOnConfirm);
    });

    expect(mockOnConfirm).toHaveBeenCalled();
    expect(mockDeleteSession).toHaveBeenCalledWith({
      agentId: 1,
      sessionId: 1,
    });
  });

  it('should not delete session if not confirmed', async () => {
    const mockOnConfirm = vi.fn().mockResolvedValue(false);
    mockUseAgentSessions.mockReturnValue({
      data: mockSessions,
      isLoading: false,
    });

    const { result } = renderHook(
      () => useChatSession({ agentId: 1, initialSessionId: 1 }),
      { wrapper }
    );

    await act(async () => {
      await result.current.handleSessionDelete(1, mockOnConfirm);
    });

    expect(mockDeleteSession).not.toHaveBeenCalled();
  });
});
