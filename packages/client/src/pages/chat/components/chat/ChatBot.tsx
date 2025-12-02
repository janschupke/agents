import { useState, useEffect, useRef } from 'react';
import { ChatBotProps } from '../../../../types/chat.types.js';
import { useSelectedBot } from '../../../../contexts/AppContext';
import { NUMERIC_CONSTANTS } from '../../../../constants/numeric.constants.js';
import { useConfirm } from '../../../../hooks/useConfirm';
import { useBots } from '../../../../hooks/queries/use-bots.js';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../../../hooks/queries/query-keys.js';
import { useChatSession } from '../../hooks/useChatSession';
import { useChatMessages } from '../../hooks/useChatMessages';
import { useChatScroll } from '../../hooks/useChatScroll';
import SessionSidebar from '../session/SessionSidebar.js';
import SessionNameModal from '../session/SessionNameModal.js';
import PageContainer from '../../../../components/ui/PageContainer.js';
import JsonModal from '../../../../components/ui/JsonModal.js';
import ChatHeader from './ChatHeader';
import ChatMessages from './ChatMessages';
import ChatInput, { ChatInputRef } from './ChatInput';
import ChatPlaceholder from './ChatPlaceholder';
import ChatLoadingState from './ChatLoadingState';
import ChatEmptyState from './ChatEmptyState';
import LoadingWrapper from '../../../../components/ui/LoadingWrapper.js';

function ChatBotContent({ botId: propBotId }: ChatBotProps) {
  const { selectedBotId, setSelectedBotId } = useSelectedBot();
  const { confirm, ConfirmDialog } = useConfirm();
  const queryClient = useQueryClient();
  
  const { data: bots = [], isLoading: loadingBots } = useBots();
  const actualBotId = propBotId || selectedBotId || (bots.length > 0 ? bots[0].id : null);

  // Use custom hooks for session and message management
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

  const [input, setInput] = useState('');
  const [jsonModal, setJsonModal] = useState<{
    isOpen: boolean;
    title: string;
    data: unknown;
  }>({ isOpen: false, title: '', data: null });
  const [sessionNameModal, setSessionNameModal] = useState<{
    isOpen: boolean;
    sessionId: number | null;
  }>({ isOpen: false, sessionId: null });

  const chatInputRef = useRef<ChatInputRef>(null);

  // Initialize bot selection
  useEffect(() => {
    if (propBotId) {
      setSelectedBotId(propBotId);
      return;
    }

    if (!loadingBots && bots.length > 0 && !selectedBotId) {
      setSelectedBotId(bots[0].id);
    }
  }, [propBotId, loadingBots, bots, selectedBotId, setSelectedBotId]);

  // Show placeholder if bot changed or no session selected for current bot
  const showChatPlaceholder = actualBotId !== null && currentSessionId === null;

  // Focus chat input when session changes
  useEffect(() => {
    if (currentSessionId && !messagesLoading && !showChatPlaceholder) {
      const timer = setTimeout(() => {
        chatInputRef.current?.focus();
      }, NUMERIC_CONSTANTS.UI_DEBOUNCE_DELAY);
      return () => clearTimeout(timer);
    }
  }, [currentSessionId, messagesLoading, showChatPlaceholder]);

  const handleSessionSelectWrapper = async (sessionId: number) => {
    await handleSessionSelect(sessionId);
    setMessages([]);
  };

  const handleNewSessionWrapper = async () => {
    await handleNewSession();
    setMessages([]);
  };

  const handleSessionDeleteWrapper = async (sessionId: number) => {
    const sessionToDelete = sessions.find((s) => s.id === sessionId);
    const sessionName = sessionToDelete?.session_name || `Session ${new Date(sessionToDelete?.createdAt || Date.now()).toLocaleDateString()}`;

    const confirmed = await confirm({
      title: 'Delete Session',
      message: `Are you sure you want to delete "${sessionName}"? This will permanently delete the session and all its messages.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      confirmVariant: 'danger',
    });

    if (confirmed) {
      await handleSessionDelete(sessionId, async () => Promise.resolve(confirmed));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !actualBotId) return;

    const message = input;
    setInput('');

    try {
      await sendMessage(message);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleSessionEdit = (sessionId: number) => {
    setSessionNameModal({ isOpen: true, sessionId });
  };

  const handleSessionNameSave = async (name?: string) => {
    // Session name is updated by the mutation hook in SessionNameModal
    // Just refresh sessions (name parameter is provided by SessionNameModal but not needed here)
    if (actualBotId) {
      queryClient.invalidateQueries({ queryKey: queryKeys.bots.sessions(actualBotId) });
    }
    // Suppress unused parameter warning
    void name;
  };

  // Show loading state
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
            onSessionEdit={handleSessionEdit}
            loading={sessionsLoading}
          />
        </LoadingWrapper>
        <div className="flex flex-col flex-1 overflow-hidden">
          <ChatHeader />
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 relative">
            {showChatPlaceholder && !messagesLoading ? (
              <ChatPlaceholder />
            ) : (
              <>
                <ChatMessages
                  key={currentSessionId || 'no-session'}
                  messages={messages}
                  loading={loading && messages.length === 0}
                  onShowJson={(title, data) => setJsonModal({ isOpen: true, title, data })}
                  sessionId={currentSessionId}
                />
                <div ref={messagesEndRef} />
              </>
            )}
          </div>
          {!showChatPlaceholder && (
            <ChatInput
              ref={chatInputRef}
              input={input}
              onInputChange={setInput}
              onSubmit={handleSubmit}
              disabled={loading}
            />
          )}
        </div>
      </div>
      <JsonModal
        isOpen={jsonModal.isOpen}
        onClose={() => setJsonModal({ isOpen: false, title: '', data: null })}
        title={jsonModal.title}
        data={jsonModal.data}
      />
      {sessionNameModal.sessionId && actualBotId && (
        <SessionNameModal
          isOpen={sessionNameModal.isOpen}
          onClose={() => setSessionNameModal({ isOpen: false, sessionId: null })}
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
