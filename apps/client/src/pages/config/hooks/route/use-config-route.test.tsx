import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useConfigRoute } from './use-config-route';
import { TestQueryProvider } from '../../../../test/utils/test-query-provider';
import { Agent } from '../../../../types/chat.types';
import { createMockAgent } from '../../../../test/utils/mock-factories';

// Mock dependencies
const mockUseAgent = vi.fn();
const mockGetSelectedAgentIdConfig = vi.fn();

vi.mock('../../../../hooks/queries/use-agents', () => ({
  useAgent: (agentId: number | null) => mockUseAgent(agentId),
}));

vi.mock('../../../../utils/localStorage', () => ({
  LocalStorageManager: {
    getSelectedAgentIdConfig: () => mockGetSelectedAgentIdConfig(),
  },
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <TestQueryProvider>{children}</TestQueryProvider>
);

describe('useConfigRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSelectedAgentIdConfig.mockReturnValue(null);
  });

  it('should parse valid agentId from string', () => {
    const mockAgent: Agent = createMockAgent({
      id: 1,
      name: 'Test Agent',
      createdAt: '2024-01-01T00:00:00.000Z',
    });

    mockUseAgent.mockReturnValue({
      data: mockAgent,
      isLoading: false,
      isError: false,
    });

    const { result } = renderHook(() => useConfigRoute('1'), { wrapper });

    expect(mockUseAgent).toHaveBeenCalledWith(1);
    expect(result.current.agentId).toBe(1);
    expect(result.current.agent).toEqual(mockAgent);
  });

  it('should return null agentId when agentId is "new"', () => {
    mockUseAgent.mockReturnValue({
      data: null,
      isLoading: false,
      isError: false,
    });

    const { result } = renderHook(() => useConfigRoute('new'), { wrapper });

    expect(mockUseAgent).toHaveBeenCalledWith(null);
    expect(result.current.agentId).toBeNull();
  });

  it('should return null agentId when agentId is undefined', () => {
    mockUseAgent.mockReturnValue({
      data: null,
      isLoading: false,
      isError: false,
    });

    const { result } = renderHook(() => useConfigRoute(undefined), {
      wrapper,
    });

    expect(mockUseAgent).toHaveBeenCalledWith(null);
    expect(result.current.agentId).toBeNull();
  });

  it('should return null agentId when agentId is invalid', () => {
    mockUseAgent.mockReturnValue({
      data: null,
      isLoading: false,
      isError: false,
    });

    const { result } = renderHook(() => useConfigRoute('invalid'), {
      wrapper,
    });

    expect(mockUseAgent).toHaveBeenCalledWith(null);
    expect(result.current.agentId).toBeNull();
  });

  it('should return error when agent is not found', () => {
    mockUseAgent.mockReturnValue({
      data: null,
      isLoading: false,
      isError: true,
    });

    const { result } = renderHook(() => useConfigRoute('1'), { wrapper });

    expect(result.current.error).toBe('Agent not found');
  });

  it('should return lastSelectedAgentId from localStorage', () => {
    mockGetSelectedAgentIdConfig.mockReturnValue(2);
    mockUseAgent.mockReturnValue({
      data: null,
      isLoading: false,
      isError: false,
    });

    const { result } = renderHook(() => useConfigRoute(undefined), {
      wrapper,
    });

    expect(result.current.lastSelectedAgentId).toBe(2);
  });
});
