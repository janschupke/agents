import { useAgent } from '../../../hooks/queries/use-agents';

interface UseAgentConfigDataOptions {
  propAgentId?: number;
  urlAgentId?: string;
}

/**
 * Hook to fetch and manage agent config data
 * Reads agentId from URL params or props
 */
export function useAgentConfigData({
  propAgentId,
  urlAgentId,
}: UseAgentConfigDataOptions) {
  const parsedAgentId =
    propAgentId ||
    (urlAgentId && urlAgentId !== 'new' && !isNaN(parseInt(urlAgentId, 10))
      ? parseInt(urlAgentId, 10)
      : null);

  const { data: agent, isLoading, isError } = useAgent(parsedAgentId);

  return {
    agentId: parsedAgentId,
    agent,
    loading: isLoading,
    error: isError ? 'Agent not found' : null,
  };
}
