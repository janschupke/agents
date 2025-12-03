import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAutoOpenAgent } from './use-auto-open-agent';
import { Agent } from '../../../../types/chat.types';

describe('useAutoOpenAgent', () => {
  const mockAgents: Agent[] = [
    {
      id: 1,
      name: 'Agent 1',
      description: null,
      avatarUrl: null,
      createdAt: '2024-01-01T00:00:00.000Z',
    },
  ];

  const mockSetCurrentAgentId = vi.fn();
  const mockOnNewAgent = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not call onNewAgent when loading', () => {
    renderHook(() =>
      useAutoOpenAgent({
        agents: [],
        currentAgentId: null,
        setCurrentAgentId: mockSetCurrentAgentId,
        loadingAgents: true,
        onNewAgent: mockOnNewAgent,
      })
    );

    expect(mockOnNewAgent).not.toHaveBeenCalled();
  });

  it('should call onNewAgent when there are no agents and no selection', () => {
    renderHook(() =>
      useAutoOpenAgent({
        agents: [],
        currentAgentId: null,
        setCurrentAgentId: mockSetCurrentAgentId,
        loadingAgents: false,
        onNewAgent: mockOnNewAgent,
      })
    );

    expect(mockOnNewAgent).toHaveBeenCalledTimes(1);
  });

  it('should not call onNewAgent when agents exist', () => {
    renderHook(() =>
      useAutoOpenAgent({
        agents: mockAgents,
        currentAgentId: null,
        setCurrentAgentId: mockSetCurrentAgentId,
        loadingAgents: false,
        onNewAgent: mockOnNewAgent,
      })
    );

    expect(mockOnNewAgent).not.toHaveBeenCalled();
  });

  it('should clear invalid selection when no agents exist', () => {
    renderHook(() =>
      useAutoOpenAgent({
        agents: [],
        currentAgentId: 999, // Invalid agent ID
        setCurrentAgentId: mockSetCurrentAgentId,
        loadingAgents: false,
        onNewAgent: mockOnNewAgent,
      })
    );

    expect(mockSetCurrentAgentId).toHaveBeenCalledWith(null);
  });

  it('should call onNewAgent when selected agent does not exist', async () => {
    const { waitFor } = await import('@testing-library/react');
    
    const { rerender } = renderHook(
      ({ currentAgentId }) =>
        useAutoOpenAgent({
          agents: [],
          currentAgentId,
          setCurrentAgentId: mockSetCurrentAgentId,
          loadingAgents: false,
          onNewAgent: mockOnNewAgent,
        }),
      {
        initialProps: { currentAgentId: 999 }, // Invalid agent ID
      }
    );

    // First effect run: clears invalid selection (returns early, resets ref)
    await waitFor(() => {
      expect(mockSetCurrentAgentId).toHaveBeenCalledWith(null);
    }, { timeout: 1000 });
    
    // Second effect run: currentAgentId is now null, should call onNewAgent
    // We need to rerender with null to trigger the second effect
    rerender({ currentAgentId: null });
    
    await waitFor(() => {
      expect(mockOnNewAgent).toHaveBeenCalledTimes(1);
    }, { timeout: 2000 });
  });

  it('should not call onNewAgent multiple times', () => {
    const { rerender } = renderHook(
      ({ agents }) =>
        useAutoOpenAgent({
          agents,
          currentAgentId: null,
          setCurrentAgentId: mockSetCurrentAgentId,
          loadingAgents: false,
          onNewAgent: mockOnNewAgent,
        }),
      {
        initialProps: { agents: [] },
      }
    );

    expect(mockOnNewAgent).toHaveBeenCalledTimes(1);

    rerender({ agents: [] });

    // Should not be called again
    expect(mockOnNewAgent).toHaveBeenCalledTimes(1);
  });
});
