import { useAgent } from '../../../../hooks/queries/use-agents';
import { LocalStorageManager } from '../../../../utils/localStorage';

/**
 * Hook to handle config route logic
 * Handles agent lookup and last selected fallback
 */
export function useConfigRoute(agentId: string | undefined) {
  const parsedAgentId =
    agentId && agentId !== 'new' && !isNaN(parseInt(agentId, 10))
      ? parseInt(agentId, 10)
      : null;

  const { data: agent, isLoading, isError } = useAgent(parsedAgentId);
  const lastSelectedAgentId = LocalStorageManager.getSelectedAgentIdConfig();

  return {
    agentId: parsedAgentId,
    agent,
    loading: isLoading,
    error: isError ? 'Agent not found' : null,
    lastSelectedAgentId,
  };
}
