import { useEffect } from 'react';
import { useSelectedAgent } from '../../../contexts/AppContext';
import { useAgents } from '../../../hooks/queries/use-agents';

interface UseChatAgentOptions {
  propAgentId?: number;
}

interface UseChatAgentReturn {
  actualAgentId: number | null;
  loadingAgents: boolean;
}

/**
 * Manages agent selection and initialization for chat
 */
export function useChatAgent({
  propAgentId,
}: UseChatAgentOptions): UseChatAgentReturn {
  const { selectedAgentId, setSelectedAgentId } = useSelectedAgent();
  const { data: agents = [], isLoading: loadingAgents } = useAgents();
  const actualAgentId =
    propAgentId || selectedAgentId || (agents.length > 0 ? agents[0].id : null);

  // Initialize agent selection
  useEffect(() => {
    if (propAgentId) {
      setSelectedAgentId(propAgentId);
      return;
    }

    if (!loadingAgents && agents.length > 0 && !selectedAgentId) {
      setSelectedAgentId(agents[0].id);
    }
  }, [propAgentId, loadingAgents, agents, selectedAgentId, setSelectedAgentId]);

  return {
    actualAgentId,
    loadingAgents,
  };
}
