import { useState } from 'react';
import type React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useDeleteMemory } from '../../../../hooks/mutations/use-agent-mutations';
import { queryKeys } from '../../../../hooks/queries/query-keys';
import { useConfirm } from '../../../../hooks/ui/useConfirm';

interface UseAgentMemoriesOptions {
  agentId: number | null;
}

interface UseAgentMemoriesReturn {
  deletingId: number | null;
  handleDeleteMemory: (memoryId: number) => Promise<void>;
  handleRefreshMemories: () => void;
  ConfirmDialog: React.ReactNode;
}

/**
 * Manages memory operations (delete, refresh) for an agent
 */
export function useAgentMemories({
  agentId,
}: UseAgentMemoriesOptions): UseAgentMemoriesReturn {
  const { confirm, ConfirmDialog } = useConfirm();
  const queryClient = useQueryClient();
  const deleteMemoryMutation = useDeleteMemory();
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

  const handleRefreshMemories = () => {
    if (!agentId || agentId < 0) return;
    queryClient.invalidateQueries({
      queryKey: queryKeys.agents.memories(agentId),
    });
  };

  return {
    deletingId,
    handleDeleteMemory,
    handleRefreshMemories,
    ConfirmDialog,
  };
}
