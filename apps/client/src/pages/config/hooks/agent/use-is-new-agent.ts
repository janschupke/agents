import { useLocation, useParams } from 'react-router-dom';
import { ROUTES } from '../../../../constants/routes.constants';

/**
 * Hook to determine if we're creating a new agent
 */
export function useIsNewAgent(propIsNewAgent?: boolean): boolean {
  const location = useLocation();
  const { agentId: urlAgentId } = useParams<{ agentId?: string }>();

  return (
    propIsNewAgent ||
    location.pathname === ROUTES.CONFIG_NEW ||
    urlAgentId === 'new'
  );
}
