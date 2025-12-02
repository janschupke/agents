import { ChatBotProps } from '../../../../types/chat.types.js';
import { useConfirm } from '../../../../hooks/useConfirm';
import { useChatBot } from '../../hooks/use-chat-bot.js';
import { useChatModals } from '../../hooks/use-chat-modals.js';
import { useChatHandlers } from '../../hooks/use-chat-handlers.js';
import { useChatInput } from '../../hooks/use-chat-input.js';
import { useChatSession } from '../../hooks/useChatSession';
import { useChatMessages } from '../../hooks/useChatMessages';
import { useChatScroll } from '../../hooks/useChatScroll';
import SessionSidebar from '../session/SessionSidebar.js';
import SessionNameModal from '../session/SessionNameModal.js';
import PageContainer from '../../../../components/ui/PageContainer.js';
import JsonModal from '../../../../components/ui/JsonModal.js';
import ChatHeader from './ChatHeader';
import ChatContent from './ChatContent';
import ChatLoadingState from './ChatLoadingState';
import ChatEmptyState from './ChatEmptyState';
import LoadingWrapper from '../../../../components/ui/LoadingWrapper.js';

function ChatBotContent({ botId: propBotId }: ChatBotProps) {
  const { ConfirmDialog } = useConfirm();

  // Bot initialization
  const { actualBotId, loadingBots } = useChatBot({ propBotId });

  // Session and message management
  const {
    currentSessionId,
    sessions,
    sessionsLoading,
    handleSessionSelect,
    handleNewSession,
    handleSessionDelete,
  } = useChatSession({ botId: actualBotId });

  const { messages, loading: messagesLoading, sendMessage, setMessages } = useChatMessages({
    botId: actualBotId,
    sessionId: currentSessionId,
  });

  const { messagesEndRef } = useChatScroll({ messages, sessionId: currentSessionId });

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
  const {
    handleSessionSelectWrapper,
    handleNewSessionWrapper,
    handleSessionDeleteWrapper,
    handleSessionNameSave,
  } = useChatHandlers({
    botId: actualBotId,
    sessions,
    handleSessionSelect,
    handleNewSession,
    handleSessionDelete,
    setMessages,
  });

  // Chat input management
  const showChatPlaceholder = actualBotId !== null && currentSessionId === null;
  const {
    input,
    setInput,
    chatInputRef,
    handleSubmit,
  } = useChatInput({
    currentSessionId,
    messagesLoading,
    showChatPlaceholder,
    sendMessage,
  });

  const loading = messagesLoading;

  if (loadingBots) {
    return <ChatLoadingState />;
  }

  if (!actualBotId) {
    return <ChatEmptyState />;
  }

  return (
    <PageContainer>
      <div className="flex h-full">
        <LoadingWrapper isLoading={sessionsLoading} loadingText="Loading sessions...">
          <SessionSidebar
            sessions={sessions}
            currentSessionId={currentSessionId}
            onSessionSelect={handleSessionSelectWrapper}
            onNewSession={handleNewSessionWrapper}
            onSessionDelete={handleSessionDeleteWrapper}
            onSessionEdit={openSessionNameModal}
            loading={sessionsLoading}
          />
        </LoadingWrapper>
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
      {sessionNameModal.sessionId && actualBotId && (
        <SessionNameModal
          isOpen={sessionNameModal.isOpen}
          onClose={closeSessionNameModal}
          currentName={
            sessions.find((s) => s.id === sessionNameModal.sessionId)?.session_name || null
          }
          onSave={handleSessionNameSave}
          botId={actualBotId}
          sessionId={sessionNameModal.sessionId}
        />
      )}
      {ConfirmDialog}
    </PageContainer>
  );
}

export default function ChatBot({ botId: propBotId }: ChatBotProps) {
  return <ChatBotContent botId={propBotId} />;
}
