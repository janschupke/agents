import { useParams, Navigate } from 'react-router-dom';
import { ROUTES } from '../../constants/routes.constants';
import ChatAgent from './components/chat/ChatAgent';
import { useChatRoute } from './hooks/use-chat-route';
import ChatLoadingState from './components/chat/ChatLoadingState';
import ChatErrorState from './components/chat/ChatErrorState';
import { useTranslation, I18nNamespace } from '@openai/i18n';

export default function ChatRoute() {
  const { sessionId } = useParams<{ sessionId?: string }>();
  const { t } = useTranslation(I18nNamespace.CLIENT);
  const { agentId, loading, error } = useChatRoute(sessionId);

  // Business logic moved to hook
  if (loading) {
    return <ChatLoadingState />;
  }

  if (error || (sessionId && !agentId)) {
    return (
      <ChatErrorState
        message={error || t('chat.errors.sessionNotFound')}
      />
    );
  }

  if (!sessionId) {
    return <ChatAgent />; // Handles empty state internally
  }

  const parsedSessionId = parseInt(sessionId, 10);
  if (isNaN(parsedSessionId)) {
    return <Navigate to={ROUTES.CHAT} replace />;
  }

  return <ChatAgent sessionId={parsedSessionId} agentId={agentId} />;
}
