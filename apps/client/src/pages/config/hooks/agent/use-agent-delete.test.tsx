import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAgentDelete } from './use-agent-delete';
import { Agent } from '../../../../types/chat.types';
import { TestQueryProvider } from '../../../../test/utils/test-query-provider';

// Mock dependencies
const mockConfirm = vi.fn();
const mockDeleteAgent = vi.fn();
const mockConfirmDialog = <div>Confirm Dialog</div>;

vi.mock('../../../../hooks/useConfirm', () => ({
  useConfirm: () => ({
    confirm: mockConfirm,
    ConfirmDialog: mockConfirmDialog,
  }),
}));

vi.mock('../../../../hooks/mutations/use-agent-mutations', () => ({
  useDeleteAgent: () => ({
    mutateAsync: mockDeleteAgent,
  }),
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <TestQueryProvider>{children}</TestQueryProvider>
);

describe('useAgentDelete', () => {
  const mockAgents: Agent[] = [
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
  });

  it('should delete agent after confirmation', async () => {
    mockConfirm.mockResolvedValue(true);
    mockDeleteAgent.mockResolvedValue(undefined);

    const { result } = renderHook(
      () => useAgentDelete({ agents: mockAgents }),
      { wrapper }
    );

    await act(async () => {
      await result.current.handleDelete(1);
    });

    expect(mockConfirm).toHaveBeenCalledWith({
      title: 'Delete Agent',
      message: expect.stringContaining('Agent 1'),
      confirmText: 'Delete',
      cancelText: 'Cancel',
      confirmVariant: 'danger',
    });

    expect(mockDeleteAgent).toHaveBeenCalledWith(1);
  });

  it('should not delete agent when confirmation is cancelled', async () => {
    mockConfirm.mockResolvedValue(false);

    const { result } = renderHook(
      () => useAgentDelete({ agents: mockAgents }),
      { wrapper }
    );

    await act(async () => {
      await result.current.handleDelete(1);
    });

    expect(mockConfirm).toHaveBeenCalled();
    expect(mockDeleteAgent).not.toHaveBeenCalled();
  });

  it('should return early if agent not found', async () => {
    const { result } = renderHook(
      () => useAgentDelete({ agents: mockAgents }),
      { wrapper }
    );

    await act(async () => {
      await result.current.handleDelete(999);
    });

    expect(mockConfirm).not.toHaveBeenCalled();
    expect(mockDeleteAgent).not.toHaveBeenCalled();
  });

  it('should return ConfirmDialog component', () => {
    const { result } = renderHook(
      () => useAgentDelete({ agents: mockAgents }),
      { wrapper }
    );

    expect(result.current.ConfirmDialog).toBe(mockConfirmDialog);
  });
});
