import { useParams, Navigate, useLocation } from 'react-router-dom';
import { ROUTES } from '../../constants/routes.constants';
import AgentConfig from './components/agent/AgentConfig';
import { useConfigRoute } from './hooks/use-config-route';
import AgentConfigErrorState from './components/agent/AgentConfigErrorState';
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

export default function ConfigRoute() {
  const { agentId } = useParams<{ agentId?: string }>();
  const location = useLocation();
  const { t } = useTranslation(I18nNamespace.CLIENT);
  const { loading, error, lastSelectedAgentId } = useConfigRoute(agentId);

  // Business logic moved to hook
  if (loading) {
    return <AgentConfigLoadingState />;
  }

  // Handle new agent route - check pathname since /config/new doesn't have a param
  if (location.pathname === ROUTES.CONFIG_NEW || agentId === 'new') {
    return <AgentConfig isNewAgent={true} />;
  }

  // If no agentId, redirect to last selected or show empty state
  if (!agentId) {
    if (lastSelectedAgentId) {
      return <Navigate to={ROUTES.CONFIG_AGENT(lastSelectedAgentId)} replace />;
    }
    return <AgentConfig />; // Handles empty state internally
  }

  const parsedAgentId = parseInt(agentId, 10);
  if (isNaN(parsedAgentId)) {
    return <Navigate to={ROUTES.CONFIG} replace />;
  }

  if (error) {
    return (
      <AgentConfigErrorState
        message={error || t('config.errors.agentNotFound')}
      />
    );
  }

  return <AgentConfig agentId={parsedAgentId} />;
}
