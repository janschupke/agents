import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAgentConfigData } from './use-agent-config-data';
import { Agent } from '../../../../types/chat.types';
import { TestQueryProvider } from '../../../../test/utils/test-query-provider';

// Mock useAgent
const mockUseAgent = vi.fn();

vi.mock('../../../../hooks/queries/use-agents', () => ({
  useAgent: (agentId: number | null) => mockUseAgent(agentId),
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <TestQueryProvider>{children}</TestQueryProvider>
);

describe('useAgentConfigData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should use propAgentId when provided', () => {
    mockUseAgent.mockReturnValue({
      data: null,
      isLoading: false,
      isError: false,
    });

    const { result } = renderHook(
      () => useAgentConfigData({ propAgentId: 1, urlAgentId: undefined }),
      { wrapper }
    );

    expect(mockUseAgent).toHaveBeenCalledWith(1);
    expect(result.current.agentId).toBe(1);
  });

  it('should parse urlAgentId when propAgentId is not provided', () => {
    mockUseAgent.mockReturnValue({
      data: null,
      isLoading: false,
      isError: false,
    });

    const { result } = renderHook(
      () => useAgentConfigData({ propAgentId: undefined, urlAgentId: '2' }),
      { wrapper }
    );

    expect(mockUseAgent).toHaveBeenCalledWith(2);
    expect(result.current.agentId).toBe(2);
  });

  it('should return null agentId when urlAgentId is "new"', () => {
    mockUseAgent.mockReturnValue({
      data: null,
      isLoading: false,
      isError: false,
    });

    const { result } = renderHook(
      () => useAgentConfigData({ propAgentId: undefined, urlAgentId: 'new' }),
      { wrapper }
    );

    expect(mockUseAgent).toHaveBeenCalledWith(null);
    expect(result.current.agentId).toBeNull();
  });

  it('should return error when agent is not found', () => {
    mockUseAgent.mockReturnValue({
      data: null,
      isLoading: false,
      isError: true,
    });

    const { result } = renderHook(
      () => useAgentConfigData({ propAgentId: 1, urlAgentId: undefined }),
      { wrapper }
    );

    expect(result.current.error).toBe('Agent not found');
  });

  it('should not return error when agentId is null', () => {
    mockUseAgent.mockReturnValue({
      data: null,
      isLoading: false,
      isError: false,
    });

    const { result } = renderHook(
      () =>
        useAgentConfigData({ propAgentId: undefined, urlAgentId: undefined }),
      { wrapper }
    );

    expect(result.current.error).toBeNull();
  });

  it('should return agent data when available', () => {
    const mockAgent: Agent = {
      id: 1,
      name: 'Test Agent',
      description: null,
      avatarUrl: null,
      createdAt: '2024-01-01T00:00:00.000Z',
    };

    mockUseAgent.mockReturnValue({
      data: mockAgent,
      isLoading: false,
      isError: false,
    });

    const { result } = renderHook(
      () => useAgentConfigData({ propAgentId: 1, urlAgentId: undefined }),
      { wrapper }
    );

    expect(result.current.agent).toEqual(mockAgent);
    expect(result.current.loading).toBe(false);
  });
});
