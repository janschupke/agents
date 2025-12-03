import { Agent } from '../../../../types/chat.types';
import { useConfirm } from '../../../../hooks/ui/useConfirm';
import { useDeleteAgent } from '../../../../hooks/mutations/use-agent-mutations';

interface UseAgentDeleteOptions {
  agents: Agent[];
}

interface UseAgentDeleteReturn {
  handleDelete: (agentId: number) => Promise<void>;
  ConfirmDialog: React.ReactNode;
}

/**
 * Hook to handle agent deletion logic
 */
export function useAgentDelete({
  agents,
}: UseAgentDeleteOptions): UseAgentDeleteReturn {
  const { ConfirmDialog, confirm } = useConfirm();
  const deleteAgentMutation = useDeleteAgent();

  const handleDelete = async (agentId: number) => {
    const agentToDelete = agents.find((a) => a.id === agentId);
    if (!agentToDelete) return;

    const confirmed = await confirm({
      title: 'Delete Agent',
      message: `Are you sure you want to delete "${agentToDelete.name}"? This will delete all related data: sessions, messages, configs, and memories.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      confirmVariant: 'danger',
    });

    if (!confirmed) return;

    await deleteAgentMutation.mutateAsync(agentId);
  };

  return {
    handleDelete,
    ConfirmDialog,
  };
}
