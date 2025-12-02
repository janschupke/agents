import { useState, useEffect, useRef } from 'react';
import { Agent } from '../../../../types/chat.types';
import { LocalStorageManager } from '../../../../utils/localStorage';

interface UseAgentSelectionOptions {
  contextAgents: Agent[];
  localAgents: Agent[];
  loadingAgents: boolean;
}

interface UseAgentSelectionReturn {
  currentAgentId: number | null;
  setCurrentAgentId: (agentId: number | null) => void;
  agents: Agent[];
}

/**
 * Manages agent selection state and initialization logic
 */
export function useAgentSelection({
  contextAgents,
  localAgents,
  loadingAgents,
}: UseAgentSelectionOptions): UseAgentSelectionReturn {
  // Load initial agent ID from localStorage
  const [currentAgentId, setCurrentAgentIdState] = useState<number | null>(() =>
    LocalStorageManager.getSelectedAgentIdConfig()
  );

  // Track if we've initialized to avoid overriding stored values
  const initializedRef = useRef(false);
  const agentsLoadedRef = useRef(false);

  // Save to localStorage whenever currentAgentId changes
  useEffect(() => {
    LocalStorageManager.setSelectedAgentIdConfig(currentAgentId);
  }, [currentAgentId]);

  // Validate and initialize currentAgentId when agents load
  useEffect(() => {
    if (loadingAgents) {
      return;
    }

    const allAgents = [...contextAgents, ...localAgents];

    // Track when agents first load
    const agentsJustLoaded = !agentsLoadedRef.current && allAgents.length > 0;
    agentsLoadedRef.current = allAgents.length > 0;

    // Only validate/initialize once when agents first load
    if (!initializedRef.current && agentsJustLoaded) {
      initializedRef.current = true;

      // Read current stored agentId (loaded from localStorage)
      const storedAgentId = currentAgentId;

      if (storedAgentId !== null) {
        // Validate stored agent exists
        const agentExists = allAgents.some((a) => a.id === storedAgentId);
        if (!agentExists) {
          // Selected agent doesn't exist, clear selection
          setCurrentAgentIdState(null);
        }
        // If agent exists, keep it - don't override
      } else {
        // If no stored agent, auto-select the first agent if available
        if (allAgents.length > 0) {
          setCurrentAgentIdState(allAgents[0].id);
        }
      }
    } else if (initializedRef.current && currentAgentId !== null) {
      // After initialization, validate agent still exists
      const agentExists = allAgents.some((a) => a.id === currentAgentId);
      if (!agentExists) {
        // Agent no longer exists, select first agent if available
        if (allAgents.length > 0) {
          setCurrentAgentIdState(allAgents[0].id);
        } else {
          setCurrentAgentIdState(null);
        }
      }
    } else if (
      initializedRef.current &&
      currentAgentId === null &&
      allAgents.length > 0
    ) {
      // If no agent is selected but agents are available, auto-select the first one
      setCurrentAgentIdState(allAgents[0].id);
    }
  }, [loadingAgents, contextAgents, localAgents, currentAgentId]);

  const setCurrentAgentId = (agentId: number | null) => {
    setCurrentAgentIdState(agentId);
    LocalStorageManager.setSelectedAgentIdConfig(agentId);
  };

  // Merge context agents with local temporary agents - new agents (localAgents) should appear at the top
  const agents = [...localAgents.filter((a) => a.id < 0), ...contextAgents];

  return {
    currentAgentId,
    setCurrentAgentId,
    agents,
  };
}
