import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  useUpdateMemory,
  useDeleteMemory,
} from '../../../hooks/mutations/use-agent-mutations';
import { queryKeys } from '../../../hooks/queries/query-keys';
import { useConfirm } from '../../../hooks/useConfirm';

interface UseAgentMemoriesOptions {
  agentId: number | null;
}

interface UseAgentMemoriesReturn {
  editingId: number | null;
  deletingId: number | null;
  handleDeleteMemory: (memoryId: number) => Promise<void>;
  handleEditMemory: (memoryId: number, newKeyPoint: string) => Promise<void>;
  handleRefreshMemories: () => void;
}

/**
 * Manages memory operations (edit, delete, refresh) for an agent
 */
export function useAgentMemories({
  agentId,
}: UseAgentMemoriesOptions): UseAgentMemoriesReturn {
  const { confirm } = useConfirm();
  const queryClient = useQueryClient();
  const updateMemoryMutation = useUpdateMemory();
  const deleteMemoryMutation = useDeleteMemory();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleDeleteMemory = async (memoryId: number) => {
    if (!agentId || agentId < 0) return;

    const confirmed = await confirm({
      title: 'Delete Memory',
      message: 'Are you sure you want to delete this memory?',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      confirmVariant: 'danger',
    });

    if (!confirmed) {
      return;
    }

    setDeletingId(memoryId);
    try {
      await deleteMemoryMutation.mutateAsync({ agentId, memoryId });
    } catch (error) {
      // Error is handled by mutation hook
      console.error('Failed to delete memory:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const handleEditMemory = async (memoryId: number, newKeyPoint: string) => {
    if (!agentId || agentId < 0) return;

    setEditingId(memoryId);
    try {
      await updateMemoryMutation.mutateAsync({
        agentId,
        memoryId,
        keyPoint: newKeyPoint,
      });
    } catch (error) {
      // Error is handled by mutation hook
      console.error('Failed to update memory:', error);
    } finally {
      setEditingId(null);
    }
  };

  const handleRefreshMemories = () => {
    if (!agentId || agentId < 0) return;
    queryClient.invalidateQueries({
      queryKey: queryKeys.agents.memories(agentId),
    });
  };

  return {
    editingId,
    deletingId,
    handleDeleteMemory,
    handleEditMemory,
    handleRefreshMemories,
  };
}
