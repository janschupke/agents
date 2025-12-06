import { useParams, Navigate, useLocation } from 'react-router-dom';
import { ROUTES } from '../../constants/routes.constants';
import AgentConfig from './components/agent/AgentConfig/AgentConfig';
import { useAgents } from '../../hooks/queries/use-agents';
import { LocalStorageManager } from '../../utils/localStorage';
import { useSidebarLoadingState } from '../../hooks/utils/use-sidebar-loading-state';
import { useTranslation, I18nNamespace } from '@openai/i18n';
import {
  Sidebar,
  Container,
  PageHeader,
  PageContent,
  Skeleton,
} from '@openai/ui';

function AgentConfigLoadingState() {
  const { t } = useTranslation(I18nNamespace.CLIENT);

  return (
    <>
      <Sidebar>
        <div className="p-3">
          <Skeleton className="h-6 w-20 mb-3" />
        </div>
      </Sidebar>
      <Container>
        <PageHeader title={t('config.title')} />
        <PageContent>
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4 mb-4" />
        </PageContent>
      </Container>
    </>
  );
}

export default function Config() {
  const { agentId } = useParams<{ agentId?: string }>();
  const location = useLocation();
  const { data: agents = [], isLoading: loadingAgents } = useAgents();

  // Use universal sidebar loading state - only show full page loading if agents aren't cached
  // If agents are cached, always render AgentConfig (even if loading specific agent)
  const { shouldShowLoading: shouldShowFullPageLoading } =
    useSidebarLoadingState({
      type: 'agents',
      isLoading: loadingAgents,
    });

  // Only show full page loading if we don't have cached agents
  // This ensures sidebar stays visible when agents are cached
  // If agents are cached, AgentConfig will handle its own loading state for specific agent
  if (shouldShowFullPageLoading) {
    return <AgentConfigLoadingState />;
  }

  // Handle new agent route - check pathname since /config/new doesn't have a param
  if (location.pathname === ROUTES.CONFIG_NEW || agentId === 'new') {
    return <AgentConfig isNewAgent={true} />;
  }

  // If no agentId, show empty state or redirect to last selected
  if (!agentId) {
    const lastSelectedAgentId = LocalStorageManager.getSelectedAgentIdConfig();
    
    // Check if last selected agent still exists
    if (lastSelectedAgentId !== null) {
      const agentExists = agents.some((a) => a.id === lastSelectedAgentId);
      if (agentExists) {
        return <Navigate to={ROUTES.CONFIG_AGENT(lastSelectedAgentId)} replace />;
      }
    }
    return <AgentConfig />; // Handles empty state internally
  }

  const parsedAgentId = parseInt(agentId, 10);
  if (isNaN(parsedAgentId)) {
    return <Navigate to={ROUTES.CONFIG} replace />;
  }

  // Check if agent exists in agents list BEFORE rendering AgentConfig
  // This prevents useAgent from being called with invalid ID
  if (!loadingAgents && parsedAgentId !== null) {
    const agentExists = agents.some((a) => a.id === parsedAgentId);
    if (!agentExists) {
      return <Navigate to={ROUTES.CONFIG} replace />;
    }
  }

  return <AgentConfig agentId={parsedAgentId} />;
}
