import { useCallback } from 'react';
import { useNavigate, NavigateFunction } from 'react-router-dom';
import { ROUTES } from '../../../constants/routes.constants';
import { LocalStorageManager } from '../../../utils/localStorage';
import { Agent } from '../../../types/chat.types';

interface UseAgentConfigNavigationOptions {
  navigate: NavigateFunction;
}

/**
 * Hook to handle agent config navigation logic
 * Replaces state management with URL navigation
 */
export function useAgentConfigNavigation({
  navigate,
}: UseAgentConfigNavigationOptions) {
  const handleAgentSelect = useCallback(
    (agentId: number) => {
      LocalStorageManager.setSelectedAgentIdConfig(agentId);
      navigate(ROUTES.CONFIG_AGENT(agentId));
    },
    [navigate]
  );

  const handleNewAgent = useCallback(() => {
    navigate(ROUTES.CONFIG_NEW);
  }, [navigate]);

  const handleSave = useCallback(
    async (agent: Agent, savedAgentId: number) => {
      LocalStorageManager.setSelectedAgentIdConfig(savedAgentId);
      navigate(ROUTES.CONFIG_AGENT(savedAgentId), { replace: true });
    },
    [navigate]
  );

  return {
    handleAgentSelect,
    handleNewAgent,
    handleSave,
  };
}
