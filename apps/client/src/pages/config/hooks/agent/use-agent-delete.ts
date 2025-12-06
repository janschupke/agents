import { useNavigate } from 'react-router-dom';
import { Agent } from '../../../../types/chat.types';
import { useConfirm } from '../../../../hooks/ui/useConfirm';
import { useDeleteAgent } from '../../../../hooks/mutations/use-agent-mutations';
import { LocalStorageManager } from '../../../../utils/localStorage';
import { ROUTES } from '../../../../constants/routes.constants';

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
  const navigate = useNavigate();
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

    try {
      await deleteAgentMutation.mutateAsync(agentId);
      
      // Clear localStorage for the deleted agent
      const storedAgentId = LocalStorageManager.getSelectedAgentIdConfig();
      if (storedAgentId === agentId) {
        LocalStorageManager.setSelectedAgentIdConfig(null);
      }
      
      // Navigate to /config to show empty state
      // This ensures sidebar still renders and user can select another agent
      navigate(ROUTES.CONFIG, { replace: true });
    } catch (error) {
      // Error is already handled by mutation hook (toast notification)
      // Don't navigate on error - let user see the error
    }
  };

  return {
    handleDelete,
    ConfirmDialog,
  };
}
