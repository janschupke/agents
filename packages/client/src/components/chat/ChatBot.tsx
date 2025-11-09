import { useState, useEffect, useRef } from 'react';

import { ChatBotProps } from '../../types/chat.types.js';
import { useBots } from '../../contexts/BotContext';
import { useSelectedBot } from '../../contexts/AppContext';
import { useChatContext } from '../../contexts/ChatContext';
import { useBotInitialization } from '../../hooks/useBotInitialization.js';
import { useSessionValidation } from '../../hooks/useSessionValidation.js';
import { useChatAutoLoad } from '../../hooks/useChatAutoLoad.js';
import { useChatHandlers } from '../../hooks/useChatHandlers.js';
import SessionSidebar from '../session/SessionSidebar.js';
import PageContainer from '../ui/PageContainer.js';
import JsonModal from '../ui/JsonModal.js';
import ChatHeader from './ChatHeader';
import ChatMessages from './ChatMessages';
import ChatInput from './ChatInput';
import ChatPlaceholder from './ChatPlaceholder';
import ChatLoadingState from './ChatLoadingState';
import ChatEmptyState from './ChatEmptyState';

function ChatBotContent({ botId: propBotId }: ChatBotProps) {
  const { bots, loadingBots, getBotSessions, refreshBotSessions, addSessionToBot } = useBots();
  const { selectedBotId, setSelectedBotId } = useSelectedBot();
  const {
    messages,
    setMessages,
    currentBotId,
    currentSessionId,
    setCurrentSessionId,
    loadingMessages,
    loadingSession,
    loadChatHistory,
    sendMessage: sendMessageToContext,
  } = useChatContext();

  const [input, setInput] = useState('');
  const [jsonModal, setJsonModal] = useState<{
    isOpen: boolean;
    title: string;
    data: unknown;
  }>({ isOpen: false, title: '', data: null });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const actualBotId = propBotId || selectedBotId || (bots.length > 0 ? bots[0].id : null);
  // Get sessions for the current bot - these are already filtered by botId in BotContext
  const sessions = actualBotId ? getBotSessions(actualBotId) || [] : [];
  const sessionsLoading = loadingBots;

  // Show placeholder if bot changed or no session selected for current bot
  const botMismatch =
    actualBotId !== null && (currentBotId === null || currentBotId !== actualBotId);
  const noSessionForCurrentBot =
    actualBotId !== null &&
    currentBotId === actualBotId &&
    currentSessionId === null &&
    messages.length === 0;
  const showChatPlaceholder = botMismatch || noSessionForCurrentBot;

  // Use custom hooks for complex logic
  useBotInitialization({
    propBotId,
    bots,
    loadingBots,
    selectedBotId,
    setSelectedBotId,
  });

  useSessionValidation({
    selectedBotId,
    currentSessionId,
    setCurrentSessionId,
    getBotSessions,
    loadingBots,
  });

  useChatAutoLoad({
    actualBotId,
    loadingBots,
    getBotSessions,
  });

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const { handleSessionSelect, handleNewSession, handleSubmit: handleSubmitMessage } =
    useChatHandlers({
      actualBotId,
      currentSessionId,
      setCurrentSessionId,
      setMessages,
      loadChatHistory,
      sendMessageToContext,
      addSessionToBot,
      refreshBotSessions,
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !actualBotId) return;

    const message = input;
    setInput('');
    await handleSubmitMessage(message);
  };

  const loading = loadingMessages || loadingSession;

  if (loadingBots) {
    return <ChatLoadingState />;
  }

  if (!actualBotId) {
    return <ChatEmptyState />;
  }

  return (
    <PageContainer>
      <div className="flex h-full">
        <SessionSidebar
          sessions={sessions}
          currentSessionId={currentSessionId}
          onSessionSelect={handleSessionSelect}
          onNewSession={handleNewSession}
          loading={sessionsLoading}
        />
        <div className="flex flex-col flex-1 overflow-hidden">
          <ChatHeader />
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
            {showChatPlaceholder && !loadingMessages && !loadingSession ? (
              <ChatPlaceholder />
            ) : (
              <>
                <ChatMessages
                  messages={messages}
                  loading={loading || (loadingMessages && messages.length === 0)}
                  onShowJson={(title, data) => setJsonModal({ isOpen: true, title, data })}
                />
                <div ref={messagesEndRef} />
              </>
            )}
          </div>
          {!showChatPlaceholder && (
            <ChatInput
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
    </PageContainer>
  );
}

export default function ChatBot({ botId: propBotId }: ChatBotProps) {
  return <ChatBotContent botId={propBotId} />;
}
