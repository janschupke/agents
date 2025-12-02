import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useChatAgentNavigation } from './use-chat-agent-navigation';
import { ROUTES } from '../../../constants/routes.constants';
import { TestQueryProvider } from '../../../test/utils/test-query-provider';

// Mock dependencies
const mockNavigate = vi.fn();
const mockCreateSession = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('../../../hooks/mutations/use-agent-mutations', () => ({
  useCreateSession: () => ({
    mutateAsync: mockCreateSession,
  }),
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <TestQueryProvider>{children}</TestQueryProvider>
);

describe('useChatAgentNavigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should navigate to session when handleSessionSelect is called', () => {
    const { result } = renderHook(
      () => useChatAgentNavigation({ agentId: 1, navigate: mockNavigate }),
      { wrapper }
    );

    act(() => {
      result.current.handleSessionSelect(5);
    });

    expect(mockNavigate).toHaveBeenCalledWith(ROUTES.CHAT_SESSION(5));
  });

  it('should create new session and navigate when handleNewSession is called', async () => {
    const newSession = {
      id: 10,
      name: null,
      createdAt: '2024-01-01T00:00:00.000Z',
    };

    mockCreateSession.mockResolvedValue(newSession);

    const { result } = renderHook(
      () => useChatAgentNavigation({ agentId: 1, navigate: mockNavigate }),
      { wrapper }
    );

    let createdSession;
    await act(async () => {
      createdSession = await result.current.handleNewSession();
    });

    expect(mockCreateSession).toHaveBeenCalledWith(1);
    expect(mockNavigate).toHaveBeenCalledWith(ROUTES.CHAT_SESSION(10));
    expect(createdSession).toEqual(newSession);
  });

  it('should return undefined when handleNewSession is called with null agentId', async () => {
    const { result } = renderHook(
      () => useChatAgentNavigation({ agentId: null, navigate: mockNavigate }),
      { wrapper }
    );

    let createdSession;
    await act(async () => {
      createdSession = await result.current.handleNewSession();
    });

    expect(mockCreateSession).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(createdSession).toBeUndefined();
  });

  it('should handle errors when creating session', async () => {
    const error = new Error('Failed to create session');
    mockCreateSession.mockRejectedValue(error);

    const { result } = renderHook(
      () => useChatAgentNavigation({ agentId: 1, navigate: mockNavigate }),
      { wrapper }
    );

    await act(async () => {
      await expect(result.current.handleNewSession()).rejects.toThrow();
    });

    expect(mockCreateSession).toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('should memoize callbacks', () => {
    const { result, rerender } = renderHook(
      () => useChatAgentNavigation({ agentId: 1, navigate: mockNavigate }),
      { wrapper }
    );

    const firstHandleSessionSelect = result.current.handleSessionSelect;
    const firstHandleNewSession = result.current.handleNewSession;

    rerender();

    expect(result.current.handleSessionSelect).toBe(firstHandleSessionSelect);
    expect(result.current.handleNewSession).toBe(firstHandleNewSession);
  });
});
