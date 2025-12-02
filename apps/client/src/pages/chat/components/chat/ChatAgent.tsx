import { useParams, useNavigate } from 'react-router-dom';
import { useConfirm } from '../../../../hooks/useConfirm';
import { useChatAgentData } from '../../hooks/use-chat-agent-data';
import { useChatAgentNavigation } from '../../hooks/use-chat-agent-navigation';
import { useChatModals } from '../../hooks/use-chat-modals';
import { useChatHandlers } from '../../hooks/use-chat-handlers';
import { useChatInput } from '../../hooks/use-chat-input';
import { useChatSession } from '../../hooks/use-chat-session';
import { useChatMessages } from '../../hooks/use-chat-messages';
import { useChatScroll } from '../../hooks/use-chat-scroll';
import SessionSidebar from '../session/SessionSidebar';
import SessionNameModal from '../session/SessionNameModal';
import { PageContainer, JsonModal } from '@openai/ui';
import ChatHeader from './ChatHeader';
import ChatContent from './ChatContent';
import ChatLoadingState from './ChatLoadingState';
import ChatEmptyState from './ChatEmptyState';
import ChatErrorState from './ChatErrorState';
import { useTranslation, I18nNamespace } from '@openai/i18n';

interface ChatAgentContentProps {
  sessionId?: number;
  agentId?: number;
  loading?: boolean;
  error?: string;
}

function ChatAgentContent({
  sessionId: propSessionId,
  agentId: propAgentId,
  loading: propLoading,
  error: propError,
}: ChatAgentContentProps) {
  const { t } = useTranslation(I18nNamespace.CLIENT);
  const { ConfirmDialog } = useConfirm();
  const navigate = useNavigate();
  const { sessionId: urlSessionId } = useParams<{ sessionId?: string }>();

  // Business logic moved to hooks
  const { sessionId, agentId, loading, error } = useChatAgentData({
    propSessionId,
    urlSessionId,
    propAgentId,
  });

  const { handleSessionSelect, handleNewSession } = useChatAgentNavigation({
    agentId,
    navigate,
  });

  // Session and message management - use sessionId from URL/params
  const { currentSessionId, sessions, sessionsLoading, handleSessionDelete } =
    useChatSession({ agentId, initialSessionId: sessionId });

  const {
    messages,
    loading: messagesLoading,
    sendMessage,
    setMessages,
  } = useChatMessages({
    agentId,
    sessionId: currentSessionId,
  });

  const { messagesEndRef } = useChatScroll({
    messages,
    sessionId: currentSessionId,
  });

  // Modal management
  const {
    jsonModal,
    sessionNameModal,
    openJsonModal,
    closeJsonModal,
    openSessionNameModal,
    closeSessionNameModal,
  } = useChatModals();

  // Session handlers with confirmations and message clearing
  // Use navigation handlers instead of internal ones
  const {
    handleSessionSelectWrapper,
    handleNewSessionWrapper,
    handleSessionDeleteWrapper,
    handleSessionNameSave,
  } = useChatHandlers({
    agentId,
    sessions,
    handleSessionSelect: async (sessionId: number) => {
      handleSessionSelect(sessionId);
      return undefined;
    },
    handleNewSession: async () => {
      await handleNewSession();
      return undefined;
    },
    handleSessionDelete,
    setMessages,
  });

  // Chat input management
  const showChatPlaceholder = agentId !== null && currentSessionId === null;
  const { input, setInput, chatInputRef, handleSubmit } = useChatInput({
    currentSessionId,
    messagesLoading,
    showChatPlaceholder,
    sendMessage,
  });

  // Loading state
  if (propLoading || messagesLoading || sessionsLoading) {
    return <ChatLoadingState />;
  }

  // Error state - show in page content
  if (propError || error) {
    return (
      <ChatErrorState
        message={propError || error || t('chat.errors.sessionNotFound')}
      />
    );
  }

  if (sessionId && !agentId) {
    return <ChatErrorState message={t('chat.errors.sessionNotFound')} />;
  }

  if (!agentId) {
    return <ChatEmptyState />;
  }

  return (
    <PageContainer>
      <div className="flex h-full">
        <SessionSidebar
          sessions={sessions}
          currentSessionId={currentSessionId}
          onSessionSelect={handleSessionSelectWrapper}
          onNewSession={handleNewSessionWrapper}
          onSessionDelete={handleSessionDeleteWrapper}
          onSessionEdit={openSessionNameModal}
          loading={sessionsLoading}
        />
        <div className="flex flex-col flex-1 overflow-hidden">
          <ChatHeader />
          <ChatContent
            messages={messages}
            loading={loading}
            showPlaceholder={showChatPlaceholder}
            sessionId={currentSessionId}
            input={input}
            inputRef={chatInputRef}
            messagesEndRef={messagesEndRef}
            onInputChange={setInput}
            onSubmit={handleSubmit}
            onShowJson={openJsonModal}
          />
        </div>
      </div>
      <JsonModal
        isOpen={jsonModal.isOpen}
        onClose={closeJsonModal}
        title={jsonModal.title}
        data={jsonModal.data}
      />
      {sessionNameModal.sessionId && agentId && (
        <SessionNameModal
          isOpen={sessionNameModal.isOpen}
          onClose={closeSessionNameModal}
          currentName={
            sessions.find((s) => s.id === sessionNameModal.sessionId)
              ?.session_name || null
          }
          onSave={handleSessionNameSave}
          agentId={agentId}
          sessionId={sessionNameModal.sessionId}
        />
      )}
      {ConfirmDialog}
    </PageContainer>
  );
}

export default function ChatAgent({
  sessionId,
  agentId,
  loading,
  error,
}: ChatAgentContentProps) {
  return (
    <ChatAgentContent
      sessionId={sessionId}
      agentId={agentId}
      loading={loading}
      error={error}
    />
  );
}
