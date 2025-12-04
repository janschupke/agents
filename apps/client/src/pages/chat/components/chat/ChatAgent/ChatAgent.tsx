import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useChatInput } from '../ChatInput/hooks/use-chat-input';
import { useChatMessages } from '../ChatMessages/hooks/use-chat-messages';
import { useChatScroll } from '../ChatMessages/hooks/use-chat-scroll';
import { useChatLoadingState } from '../../../hooks/use-chat-loading-state';
import { useAgents } from '../../../../../hooks/queries/use-agents';
import { useChatModals } from '../../../hooks/use-chat-modals';
import AgentSidebar from '../../agent/AgentSidebar/AgentSidebar';
import SavedWordModal from '../../saved-word/SavedWordModal/SavedWordModal';
import {
  Sidebar,
  Container,
  PageHeader,
  PageContent,
  JsonModal,
  Avatar,
  Button,
  IconSettings,
} from '@openai/ui';
import ChatContent from '../ChatContent/ChatContent';
import ChatLoadingState from '../ChatLoadingState/ChatLoadingState';
import ChatEmptyState from '../ChatEmptyState/ChatEmptyState';
import ContainerSkeleton from '../Skeletons/ContainerSkeleton';
import ContentSkeleton from '../Skeletons/ContentSkeleton';
import { useTranslation, I18nNamespace } from '@openai/i18n';
import { ROUTES } from '../../../../../constants/routes.constants';

interface ChatAgentContentProps {
  agentId?: number | null;
  loading?: boolean;
  error?: string;
}

function ChatAgentContent({
  agentId: propAgentId,
  loading: propLoading,
  error: propError,
}: ChatAgentContentProps) {
  const { t } = useTranslation(I18nNamespace.CLIENT);
  const navigate = useNavigate();
  const { agentId: urlAgentId } = useParams<{ agentId?: string }>();

  // Determine agentId from props or URL
  const agentId =
    propAgentId ??
    (urlAgentId && !isNaN(parseInt(urlAgentId, 10))
      ? parseInt(urlAgentId, 10)
      : null);

  const { data: agents = [], isLoading: agentsLoading } = useAgents();
  const agent = agentId ? agents.find((a) => a.id === agentId) || null : null;

  // Backend automatically returns first session for agent
  // UI is completely agnostic to sessions - backend handles multiple sessions internally
  // useChatMessages will handle fetching chat history and getting sessionId
  const {
    messages,
    savedWordMatches,
    loading: messagesLoading,
    isSendingMessage,
    sendMessage,
    setMessages,
    messagesContainerRef,
    isFetchingMore, // Get isFetchingMore to prevent scroll when loading older messages
    sessionId, // Get sessionId from useChatMessages (comes from query data)
  } = useChatMessages({
    agentId,
    sessionId: undefined, // Pass undefined - backend will return first session
  });

  const { messagesEndRef } = useChatScroll({
    messages,
    sessionId,
  });

  // Modal management
  const {
    jsonModal,
    openJsonModal,
    closeJsonModal,
  } = useChatModals();

  // Saved word modal state
  const [savedWordModal, setSavedWordModal] = useState<{
    isOpen: boolean;
    originalWord: string;
    translation: string;
    pinyin: string | null;
    sentence?: string;
    messageId?: number;
    savedWordId?: number;
  }>({
    isOpen: false,
    originalWord: '',
    translation: '',
    pinyin: null,
  });

  const handleWordClick = (
    word: string,
    translation: string,
    pinyin: string | null,
    savedWordId?: number,
    sentence?: string,
    messageId?: number
  ) => {
    setSavedWordModal({
      isOpen: true,
      originalWord: word,
      translation,
      pinyin,
      sentence,
      messageId,
      savedWordId,
    });
  };

  const closeSavedWordModal = () => {
    setSavedWordModal({
      isOpen: false,
      originalWord: '',
      translation: '',
      pinyin: null,
    });
  };

  const handleAgentSelect = (newAgentId: number) => {
    navigate(ROUTES.CHAT_AGENT(newAgentId));
  };

  const handleNewAgent = () => {
    navigate(ROUTES.CONFIG_NEW);
  };

  // Unified loading state management
  const {
    isInitialLoad,
    sidebarLoading,
    containerLoading,
    contentLoading,
    showTypingIndicator,
  } = useChatLoadingState({
    agentId,
    sessionId,
    agentsLoading,
    sessionsLoading: false, // No session loading - backend handles it
    messagesLoading,
    isSendingMessage,
  });

  // Chat input management
  const showChatPlaceholder = agentId !== null && sessionId === null;
  const { input, setInput, chatInputRef, handleSubmit, onRefReady } =
    useChatInput({
      currentSessionId: sessionId,
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

  // Handle null agentId - show empty state
  if (!agentId) {
    return (
      <>
        <Sidebar>
          <AgentSidebar
            agents={agents}
            currentAgentId={null}
            onAgentSelect={handleAgentSelect}
            onNewAgent={handleNewAgent}
            loading={agentsLoading}
          />
        </Sidebar>
        <Container>
          <PageHeader
            actions={
              <Button
                variant="icon"
                disabled={true}
              >
                <IconSettings size="md" />
              </Button>
            }
          />
          <PageContent>
            <div className="flex flex-col items-center justify-center h-full">
              <p className="text-text-secondary">{t('chat.noChatSelected')}</p>
            </div>
          </PageContent>
        </Container>
      </>
    );
  }

  return (
    <>
      <Sidebar>
        <AgentSidebar
          agents={agents}
          currentAgentId={agentId}
          onAgentSelect={handleAgentSelect}
          onNewAgent={handleNewAgent}
          loading={sidebarLoading || agentsLoading}
        />
      </Sidebar>
      <Container>
        {containerLoading ? (
          <ContainerSkeleton />
        ) : (
          <>
            <PageHeader
              leftContent={
                agent ? (
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={agent.avatarUrl || undefined}
                      name={agent.name}
                      size="md"
                    />
                    <h2 className="text-lg font-semibold text-text-secondary">
                      {agent.name}
                    </h2>
                  </div>
                ) : null
              }
              actions={
                <Button
                  variant="icon"
                  onClick={() => navigate(ROUTES.CONFIG_AGENT(agentId!))}
                  disabled={!agentId}
                  tooltip={agentId ? t('chat.configureAgent') : undefined}
                >
                  <IconSettings size="md" />
                </Button>
              }
            />
            <PageContent
              animateOnChange={sessionId}
              enableAnimation={true}
              disableScroll={true}
            >
              {contentLoading ? (
                <ContentSkeleton />
              ) : (
                <ChatContent
                  messages={messages}
                  savedWordMatches={savedWordMatches}
                  onWordClick={handleWordClick}
                  showTypingIndicator={showTypingIndicator}
                  contentLoading={false}
                  showPlaceholder={showChatPlaceholder}
                  sessionId={sessionId}
                  agent={agent}
                  input={input}
                  inputRef={chatInputRef}
                  messagesEndRef={messagesEndRef}
                  messagesContainerRef={messagesContainerRef}
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
      {savedWordModal.isOpen && agentId && (
        <SavedWordModal
          isOpen={savedWordModal.isOpen}
          onClose={closeSavedWordModal}
          originalWord={savedWordModal.originalWord}
          translation={savedWordModal.translation}
          pinyin={savedWordModal.pinyin}
          sentence={savedWordModal.sentence}
          messageId={savedWordModal.messageId}
          agentId={agentId}
          sessionId={sessionId}
          savedWordId={savedWordModal.savedWordId}
        />
      )}
    </>
  );
}

export default function ChatAgent({
  agentId,
  loading,
  error,
}: ChatAgentContentProps) {
  return (
    <ChatAgentContent agentId={agentId} loading={loading} error={error} />
  );
}
