import { useParams, useNavigate } from 'react-router-dom';
import { useConfirm } from '../../../../hooks/ui/useConfirm';
import { useChatAgentNavigation } from '../../hooks/use-chat-agent-navigation';
import { useChatModals } from '../../hooks/use-chat-modals';
import { useChatHandlers } from '../../hooks/use-chat-handlers';
import { useChatInput } from '../ChatInput/hooks/use-chat-input';
import { useChatSession } from '../../hooks/use-chat-session';
import { useChatMessages } from '../ChatMessages/hooks/use-chat-messages';
import { useChatScroll } from '../ChatMessages/hooks/use-chat-scroll';
import { useChatLoadingState } from '../../hooks/use-chat-loading-state';
import { useAgents } from '../../../../hooks/queries/use-agents';
import SessionSidebar from '../session/SessionSidebar/SessionSidebar';
import SessionNameModal from '../session/SessionNameModal/SessionNameModal';
import {
  Sidebar,
  Container,
  PageHeader,
  PageContent,
  JsonModal,
} from '@openai/ui';
import AgentSelector from '../../agent/AgentSelector/AgentSelector';
import ChatContent from '../ChatContent/ChatContent';
import ChatLoadingState from '../ChatLoadingState/ChatLoadingState';
import ChatEmptyState from '../ChatEmptyState/ChatEmptyState';
import ChatErrorState from '../ChatErrorState/ChatErrorState';
import ContainerSkeleton from '../Skeletons/ContainerSkeleton';
import ContentSkeleton from '../Skeletons/ContentSkeleton';
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

  // Determine agentId and sessionId from props or URL
  const agentId = propAgentId ?? null;
  const sessionId =
    propSessionId ||
    (urlSessionId && !isNaN(parseInt(urlSessionId, 10))
      ? parseInt(urlSessionId, 10)
      : null);

  const { isLoading: agentsLoading } = useAgents();

  const { handleSessionSelect, handleNewSession } = useChatAgentNavigation({
    agentId,
    navigate,
  });

  // Session and message management - use sessionId from URL/params
  // Convert null to undefined so useChatSession can properly detect when to auto-select
  const { currentSessionId, sessions, sessionsLoading, handleSessionDelete } =
    useChatSession({ agentId, initialSessionId: sessionId ?? undefined });

  const {
    messages,
    loading: messagesLoading,
    isSendingMessage,
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

  // Unified loading state management
  // Loading state is now calculated based on React Query cache, not array length
  // This ensures sidebar doesn't show loading when data exists in cache
  const {
    isInitialLoad,
    sidebarLoading,
    containerLoading,
    contentLoading,
    showTypingIndicator,
  } = useChatLoadingState({
    agentId,
    sessionId: currentSessionId,
    agentsLoading,
    sessionsLoading,
    messagesLoading,
    isSendingMessage,
  });

  // Chat input management
  const showChatPlaceholder = agentId !== null && currentSessionId === null;
  const { input, setInput, chatInputRef, handleSubmit, onRefReady } = useChatInput({
    currentSessionId,
    messagesLoading: false, // Don't disable input based on loading
    showChatPlaceholder,
    showTypingIndicator,
    agentId,
    sendMessage,
  });

  // Full page loading (only on initial load)
  if (isInitialLoad || propLoading) {
    return <ChatLoadingState />;
  }

  // Error state - show in page content
  if (propError) {
    return (
      <ChatErrorState message={propError || t('chat.errors.sessionNotFound')} />
    );
  }

  if (sessionId && !agentId) {
    return <ChatErrorState message={t('chat.errors.sessionNotFound')} />;
  }

  if (!agentId) {
    return <ChatEmptyState />;
  }

  return (
    <>
      <Sidebar>
        <SessionSidebar
          sessions={sessions}
          agentId={agentId}
          currentSessionId={currentSessionId}
          onSessionSelect={handleSessionSelectWrapper}
          onNewSession={handleNewSessionWrapper}
          onSessionDelete={handleSessionDeleteWrapper}
          onSessionEdit={openSessionNameModal}
          loading={sidebarLoading}
        />
      </Sidebar>
      <Container>
        {containerLoading ? (
          <ContainerSkeleton />
        ) : (
          <>
            <PageHeader leftContent={<AgentSelector />} />
            <PageContent
              animateOnChange={currentSessionId}
              enableAnimation={true}
              disableScroll={true}
            >
              {contentLoading ? (
                <ContentSkeleton />
              ) : (
                <ChatContent
                  messages={messages}
                  showTypingIndicator={showTypingIndicator}
                  contentLoading={false}
                  showPlaceholder={showChatPlaceholder}
                  sessionId={currentSessionId}
                  input={input}
                  inputRef={chatInputRef}
                  messagesEndRef={messagesEndRef}
                  onInputChange={setInput}
                  onSubmit={handleSubmit}
                  onShowJson={openJsonModal}
                  onInputRefReady={onRefReady}
                />
              )}
            </PageContent>
          </>
        )}
      </Container>
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
    </>
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
