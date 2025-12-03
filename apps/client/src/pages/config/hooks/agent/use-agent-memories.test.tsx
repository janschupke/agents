import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAgentMemories } from './use-agent-memories';
import { TestQueryProvider } from '../../../../test/utils/test-query-provider';

// Mock dependencies
const mockConfirm = vi.fn();
const mockUpdateMemory = vi.fn();
const mockDeleteMemory = vi.fn();
const mockInvalidateQueries = vi.fn();

vi.mock('../../../../hooks/useConfirm', () => ({
  useConfirm: () => ({
    confirm: mockConfirm,
  }),
}));

vi.mock('../../../../hooks/mutations/use-agent-mutations', () => ({
  useUpdateMemory: () => ({
    mutateAsync: mockUpdateMemory,
  }),
  useDeleteMemory: () => ({
    mutateAsync: mockDeleteMemory,
  }),
}));

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query');
  return {
    ...actual,
    useQueryClient: () => ({
      invalidateQueries: mockInvalidateQueries,
    }),
  };
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <TestQueryProvider>{children}</TestQueryProvider>
);

describe('useAgentMemories', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with null editingId and deletingId', () => {
    const { result } = renderHook(() => useAgentMemories({ agentId: 1 }), {
      wrapper,
    });

    expect(result.current.editingId).toBeNull();
    expect(result.current.deletingId).toBeNull();
  });

  it('should delete memory after confirmation', async () => {
    mockConfirm.mockResolvedValue(true);
    mockDeleteMemory.mockResolvedValue(undefined);

    const { result } = renderHook(() => useAgentMemories({ agentId: 1 }), {
      wrapper,
    });

    await act(async () => {
      await result.current.handleDeleteMemory(1);
    });

    expect(mockConfirm).toHaveBeenCalledWith({
      title: 'Delete Memory',
      message: 'Are you sure you want to delete this memory?',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      confirmVariant: 'danger',
    });

    expect(mockDeleteMemory).toHaveBeenCalledWith({ agentId: 1, memoryId: 1 });
    expect(result.current.deletingId).toBeNull();
  });

  it('should not delete memory when confirmation is cancelled', async () => {
    mockConfirm.mockResolvedValue(false);

    const { result } = renderHook(() => useAgentMemories({ agentId: 1 }), {
      wrapper,
    });

    await act(async () => {
      await result.current.handleDeleteMemory(1);
    });

    expect(mockConfirm).toHaveBeenCalled();
    expect(mockDeleteMemory).not.toHaveBeenCalled();
  });

  it('should not delete memory when agentId is null', async () => {
    const { result } = renderHook(() => useAgentMemories({ agentId: null }), {
      wrapper,
    });

    await act(async () => {
      await result.current.handleDeleteMemory(1);
    });

    expect(mockConfirm).not.toHaveBeenCalled();
    expect(mockDeleteMemory).not.toHaveBeenCalled();
  });

  it('should not delete memory when agentId is negative', async () => {
    const { result } = renderHook(() => useAgentMemories({ agentId: -1 }), {
      wrapper,
    });

    await act(async () => {
      await result.current.handleDeleteMemory(1);
    });

    expect(mockConfirm).not.toHaveBeenCalled();
    expect(mockDeleteMemory).not.toHaveBeenCalled();
  });

  it('should edit memory', async () => {
    mockUpdateMemory.mockResolvedValue(undefined);

    const { result } = renderHook(() => useAgentMemories({ agentId: 1 }), {
      wrapper,
    });

    await act(async () => {
      await result.current.handleEditMemory(1, 'Updated key point');
    });

    expect(mockUpdateMemory).toHaveBeenCalledWith({
      agentId: 1,
      memoryId: 1,
      keyPoint: 'Updated key point',
    });
    expect(result.current.editingId).toBeNull();
  });

  it('should not edit memory when agentId is null', async () => {
    const { result } = renderHook(() => useAgentMemories({ agentId: null }), {
      wrapper,
    });

    await act(async () => {
      await result.current.handleEditMemory(1, 'Updated key point');
    });

    expect(mockUpdateMemory).not.toHaveBeenCalled();
  });

  it('should refresh memories', () => {
    const { result } = renderHook(() => useAgentMemories({ agentId: 1 }), {
      wrapper,
    });

    act(() => {
      result.current.handleRefreshMemories();
    });

    expect(mockInvalidateQueries).toHaveBeenCalled();
  });

  it('should not refresh memories when agentId is null', () => {
    const { result } = renderHook(() => useAgentMemories({ agentId: null }), {
      wrapper,
    });

    act(() => {
      result.current.handleRefreshMemories();
    });

    expect(mockInvalidateQueries).not.toHaveBeenCalled();
  });
});
