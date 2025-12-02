import { useParams, Navigate } from 'react-router-dom';
import { ROUTES } from '../../constants/routes.constants';
import AgentConfig from './components/agent/AgentConfig';
import NewAgentConfig from './components/agent/NewAgentConfig';
import { useConfigRoute } from './hooks/use-config-route';
import AgentConfigErrorState from './components/agent/AgentConfigErrorState';
import { useTranslation, I18nNamespace } from '@openai/i18n';
import { PageContainer, PageHeader } from '@openai/ui';
import { Skeleton } from '@openai/ui';

function AgentConfigLoadingState() {
  return (
    <PageContainer>
      <div className="flex h-full">
        <div className="w-56 border-r border-border p-3">
          <Skeleton className="h-6 w-20 mb-3" />
        </div>
        <div className="flex-1 flex flex-col overflow-hidden">
          <PageHeader title="Agent Configuration" />
          <div className="flex-1 overflow-y-auto p-5">
            <Skeleton className="h-8 w-48 mb-4" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4 mb-4" />
          </div>
        </div>
      </div>
    </PageContainer>
  );
}

export default function ConfigRoute() {
  const { agentId } = useParams<{ agentId?: string }>();
  const { t } = useTranslation(I18nNamespace.CLIENT);
  const { loading, error, lastSelectedAgentId } = useConfigRoute(agentId);

  // Business logic moved to hook
  if (loading) {
    return <AgentConfigLoadingState />;
  }

  // Handle new agent route
  if (agentId === 'new') {
    return <NewAgentConfig />;
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
