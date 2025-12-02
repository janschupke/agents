import { useEffect, useRef } from 'react';
import { Agent } from '../../../types/chat.types';

interface UseAutoOpenAgentOptions {
  agents: Agent[];
  currentAgentId: number | null;
  setCurrentAgentId: (agentId: number | null) => void;
  loadingAgents: boolean;
  onNewAgent: () => void;
}

/**
 * Hook to automatically open a new agent form when there are no agents
 */
export function useAutoOpenAgent({
  agents,
  currentAgentId,
  setCurrentAgentId,
  loadingAgents,
  onNewAgent,
}: UseAutoOpenAgentOptions) {
  const hasAutoOpenedRef = useRef(false);

  useEffect(() => {
    if (loadingAgents) {
      return;
    }

    const hasNoAgents = agents.length === 0;
    const currentAgentExists =
      currentAgentId !== null &&
      agents.some((a) => a.id === currentAgentId);

    // If there are no agents, clear any invalid selection and reset the ref
    if (hasNoAgents && currentAgentId !== null && !currentAgentExists) {
      setCurrentAgentId(null);
      hasAutoOpenedRef.current = false;
      return;
    }

    // Auto-open form when there are no agents and none is selected (or selected agent doesn't exist)
    if (
      hasNoAgents &&
      (currentAgentId === null || !currentAgentExists) &&
      !hasAutoOpenedRef.current
    ) {
      hasAutoOpenedRef.current = true;
      onNewAgent();
    }
  }, [
    loadingAgents,
    agents,
    currentAgentId,
    setCurrentAgentId,
    onNewAgent,
  ]);
}
