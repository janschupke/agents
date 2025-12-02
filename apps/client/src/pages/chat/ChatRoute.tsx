import { useParams, Navigate, useLocation } from 'react-router-dom';
import { ROUTES } from '../../constants/routes.constants';
import ChatAgent from './components/chat/ChatAgent';
import { useChatRoute } from './hooks/use-chat-route';
import ChatLoadingState from './components/chat/ChatLoadingState';
import ChatErrorState from './components/chat/ChatErrorState';
import { useTranslation, I18nNamespace } from '@openai/i18n';

export default function ChatRoute() {
  const { sessionId } = useParams<{ sessionId?: string }>();
  const location = useLocation();
  const { t } = useTranslation(I18nNamespace.CLIENT);
  // Use location.state to force re-run when agent changes (via navigation state)
  const { agentId, loading, error } = useChatRoute(sessionId, location.state?.agentChanged);

  // Business logic moved to hook
  if (loading) {
    return <ChatLoadingState />;
  }

  if (error || (sessionId && !agentId)) {
    return (
      <ChatErrorState message={error || t('chat.errors.sessionNotFound')} />
    );
  }

  if (!sessionId) {
    // Pass agentId so ChatAgent doesn't show empty state when agents exist
    return <ChatAgent agentId={agentId ?? undefined} />;
  }

  const parsedSessionId = parseInt(sessionId, 10);
  if (isNaN(parsedSessionId)) {
    return <Navigate to={ROUTES.CHAT} replace />;
  }

  return (
    <ChatAgent sessionId={parsedSessionId} agentId={agentId ?? undefined} />
  );
}
