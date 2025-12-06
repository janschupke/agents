import { useParams, Navigate } from 'react-router-dom';
import { ROUTES } from '../../constants/routes.constants';
import ChatAgent from './components/chat/ChatAgent/ChatAgent';
import ChatLoadingState from './components/chat/ChatLoadingState/ChatLoadingState';
import { useAgents } from '../../hooks/queries/use-agents';

export default function Chat() {
  const { agentId: urlAgentId } = useParams<{ agentId?: string }>();
  const { data: agents = [], isLoading: loadingAgents } = useAgents();

  const parsedAgentId = urlAgentId
    ? isNaN(parseInt(urlAgentId, 10))
      ? null
      : parseInt(urlAgentId, 10)
    : null;

  // Handle /chat route (no agentId) - show empty state, do not redirect
  if (!urlAgentId) {
    if (loadingAgents) {
      return <ChatLoadingState />;
    }
    // Show chat page with empty sidebar and "No chat selected" message
    return <ChatAgent agentId={null} />;
  }

  // Invalid agentId format
  if (parsedAgentId === null) {
    return <Navigate to={ROUTES.CHAT} replace />;
  }

  // Check if agent exists after agents have loaded
  // If agentId is provided but agent doesn't exist, redirect to /chat
  if (!loadingAgents && parsedAgentId !== null) {
    const agentExists = agents.some((a) => a.id === parsedAgentId);
    if (!agentExists) {
      return <Navigate to={ROUTES.CHAT} replace />;
    }
  }

  // Handle /chat/:agentId route
  return <ChatAgent agentId={parsedAgentId} />;
}
