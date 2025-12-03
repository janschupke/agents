import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAgentSelection } from './use-agent-selection';
import { Agent } from '../../../../types/chat.types';

// Mock localStorage
const mockGetSelectedAgentIdConfig = vi.fn();
const mockSetSelectedAgentIdConfig = vi.fn();

vi.mock('../../../../utils/localStorage', () => ({
  LocalStorageManager: {
    getSelectedAgentIdConfig: () => mockGetSelectedAgentIdConfig(),
    setSelectedAgentIdConfig: (agentId: number | null) => mockSetSelectedAgentIdConfig(agentId),
  },
}));

describe('useAgentSelection', () => {
  const mockContextAgents: Agent[] = [
    {
      id: 1,
      name: 'Agent 1',
      description: null,
      avatarUrl: null,
      createdAt: '2024-01-01T00:00:00.000Z',
    },
    {
      id: 2,
      name: 'Agent 2',
      description: null,
      avatarUrl: null,
      createdAt: '2024-01-02T00:00:00.000Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSelectedAgentIdConfig.mockReturnValue(null);
  });

  it('should initialize with agent ID from localStorage', () => {
    mockGetSelectedAgentIdConfig.mockReturnValue(1);

    const { result } = renderHook(() =>
      useAgentSelection({
        contextAgents: mockContextAgents,
        localAgents: [],
        loadingAgents: false,
      })
    );

    expect(result.current.currentAgentId).toBe(1);
  });

  it('should auto-select first agent when no stored agent and agents are available', async () => {
    mockGetSelectedAgentIdConfig.mockReturnValue(null);

    const { result } = renderHook(() =>
      useAgentSelection({
        contextAgents: mockContextAgents,
        localAgents: [],
        loadingAgents: false,
      })
    );

    await waitFor(() => {
      expect(result.current.currentAgentId).toBe(1);
    });
  });

  it('should validate stored agent exists and auto-select first agent if invalid', async () => {
    mockGetSelectedAgentIdConfig.mockReturnValue(999); // Non-existent agent

    const { result } = renderHook(() =>
      useAgentSelection({
        contextAgents: mockContextAgents,
        localAgents: [],
        loadingAgents: false,
      })
    );

    await waitFor(() => {
      // When stored agent doesn't exist, it clears the selection
      // Then auto-selects the first available agent
      expect(result.current.currentAgentId).toBe(1); // First agent
    });
  });

  it('should merge local agents with context agents', () => {
    const localAgents: Agent[] = [
      {
        id: -1,
        name: 'New Agent',
        description: null,
        avatarUrl: null,
        createdAt: '2024-01-03T00:00:00.000Z',
      },
    ];

    const { result } = renderHook(() =>
      useAgentSelection({
        contextAgents: mockContextAgents,
        localAgents,
        loadingAgents: false,
      })
    );

    // Local agents (with negative IDs) should appear first
    expect(result.current.agents).toEqual([...localAgents, ...mockContextAgents]);
  });

  it('should save to localStorage when currentAgentId changes', async () => {
    const { result } = renderHook(() =>
      useAgentSelection({
        contextAgents: mockContextAgents,
        localAgents: [],
        loadingAgents: false,
      })
    );

    await act(async () => {
      result.current.setCurrentAgentId(2);
    });

    expect(mockSetSelectedAgentIdConfig).toHaveBeenCalledWith(2);
  });

  it('should not initialize when loading', () => {
    mockGetSelectedAgentIdConfig.mockReturnValue(null);

    const { result } = renderHook(() =>
      useAgentSelection({
        contextAgents: mockContextAgents,
        localAgents: [],
        loadingAgents: true,
      })
    );

    expect(result.current.currentAgentId).toBeNull();
  });

  it('should select first agent when current agent no longer exists', async () => {
    mockGetSelectedAgentIdConfig.mockReturnValue(1);

    const { result, rerender } = renderHook(
      ({ contextAgents }) =>
        useAgentSelection({
          contextAgents,
          localAgents: [],
          loadingAgents: false,
        }),
      {
        initialProps: { contextAgents: mockContextAgents },
      }
    );

    await waitFor(() => {
      expect(result.current.currentAgentId).toBe(1);
    });

    // Remove agent 1
    rerender({ contextAgents: [mockContextAgents[1]] });

    await waitFor(() => {
      expect(result.current.currentAgentId).toBe(2);
    });
  });
});
