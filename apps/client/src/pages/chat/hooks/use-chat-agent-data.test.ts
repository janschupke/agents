import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { TestQueryProvider } from '../../../test/utils/test-query-provider';
import { useChatAgentData } from './use-chat-agent-data';

// Mock useSessionWithAgent
const mockUseSessionWithAgent = vi.fn();
vi.mock('./use-session-with-agent', () => ({
  useSessionWithAgent: (sessionId: number | null) => mockUseSessionWithAgent(sessionId),
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <TestQueryProvider>{children}</TestQueryProvider>
);

describe('useChatAgentData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should use propAgentId when provided', async () => {
    const { result } = renderHook(
      () =>
        useChatAgentData({
          propAgentId: 5,
          propSessionId: undefined,
          urlSessionId: undefined,
        }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.agentId).toBe(5);
      expect(result.current.sessionId).toBe(null);
    });

    // Should not call useSessionWithAgent when propAgentId is provided
    expect(mockUseSessionWithAgent).toHaveBeenCalledWith(null);
  });

  it('should use sessionAgentId when no propAgentId but sessionId exists', async () => {
    mockUseSessionWithAgent.mockReturnValue({
      agentId: 3,
      loading: false,
      error: null,
    });

    const { result } = renderHook(
      () =>
        useChatAgentData({
          propAgentId: undefined,
          propSessionId: 123,
          urlSessionId: undefined,
        }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.agentId).toBe(3);
      expect(result.current.sessionId).toBe(123);
    });

    expect(mockUseSessionWithAgent).toHaveBeenCalledWith(123);
  });

  it('should use urlSessionId when no propSessionId', async () => {
    mockUseSessionWithAgent.mockReturnValue({
      agentId: 4,
      loading: false,
      error: null,
    });

    const { result } = renderHook(
      () =>
        useChatAgentData({
          propAgentId: undefined,
          propSessionId: undefined,
          urlSessionId: '456',
        }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.agentId).toBe(4);
      expect(result.current.sessionId).toBe(456);
    });

    expect(mockUseSessionWithAgent).toHaveBeenCalledWith(456);
  });

  it('should prefer propSessionId over urlSessionId', async () => {
    mockUseSessionWithAgent.mockReturnValue({
      agentId: 7,
      loading: false,
      error: null,
    });

    const { result } = renderHook(
      () =>
        useChatAgentData({
          propAgentId: undefined,
          propSessionId: 789,
          urlSessionId: '456',
        }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.sessionId).toBe(789);
    });

    expect(mockUseSessionWithAgent).toHaveBeenCalledWith(789);
  });

  it('should return null agentId when no sources provide it', async () => {
    mockUseSessionWithAgent.mockReturnValue({
      agentId: null,
      loading: false,
      error: null,
    });

    const { result } = renderHook(
      () =>
        useChatAgentData({
          propAgentId: undefined,
          propSessionId: undefined,
          urlSessionId: undefined,
        }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.agentId).toBe(null);
      expect(result.current.sessionId).toBe(null);
    });
  });

  it('should handle loading state', async () => {
    mockUseSessionWithAgent.mockReturnValue({
      agentId: null,
      loading: true,
      error: null,
    });

    const { result } = renderHook(
      () =>
        useChatAgentData({
          propAgentId: undefined,
          propSessionId: 123,
          urlSessionId: undefined,
        }),
      { wrapper }
    );

    expect(result.current.loading).toBe(true);
  });

  it('should handle error state', async () => {
    mockUseSessionWithAgent.mockReturnValue({
      agentId: null,
      loading: false,
      error: 'Session not found',
    });

    const { result } = renderHook(
      () =>
        useChatAgentData({
          propAgentId: undefined,
          propSessionId: 123,
          urlSessionId: undefined,
        }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.error).toBe('Session not found');
    });
  });

  it('should parse urlSessionId correctly', async () => {
    mockUseSessionWithAgent.mockReturnValue({
      agentId: 8,
      loading: false,
      error: null,
    });

    const { result } = renderHook(
      () =>
        useChatAgentData({
          propAgentId: undefined,
          propSessionId: undefined,
          urlSessionId: '999',
        }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.sessionId).toBe(999);
    });
  });

  it('should handle invalid urlSessionId', async () => {
    mockUseSessionWithAgent.mockReturnValue({
      agentId: null,
      loading: false,
      error: null,
    });

    const { result } = renderHook(
      () =>
        useChatAgentData({
          propAgentId: undefined,
          propSessionId: undefined,
          urlSessionId: 'invalid',
        }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.sessionId).toBe(null);
    });

    // Should not call useSessionWithAgent with invalid sessionId
    expect(mockUseSessionWithAgent).toHaveBeenCalledWith(null);
  });
});
