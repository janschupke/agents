import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ChatBotProps, Message } from '../types/chat.types.js';
import SessionSidebar from './SessionSidebar.js';
import PageContainer from './PageContainer.js';
import PageHeader from './PageHeader.js';
import { IconSend, IconSearch } from './Icons';
import { Skeleton, SkeletonMessage, SkeletonList } from './Skeleton';
import JsonModal from './JsonModal.js';
import { useBots } from '../contexts/BotContext';
import { useSelectedBot } from '../contexts/AppContext';
import { ChatProvider, useChatContext } from '../contexts/ChatContext';
import { ChatService } from '../services/chat.service';

function ChatBotContent({ botId: propBotId }: ChatBotProps) {
  const { isSignedIn, isLoaded } = useAuth();
  const { bots, loadingBots, getBotSessions, refreshBotSessions, addSessionToBot } = useBots();
  const { selectedBotId, setSelectedBotId } = useSelectedBot();
  const {
    messages,
    botName,
    currentBotId,
    currentSessionId,
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
  const sessions = actualBotId ? (getBotSessions(actualBotId) || []) : [];
  const sessionsLoading = loadingBots;

  // Use propBotId if provided, otherwise use persisted selectedBotId, otherwise use first bot
  useEffect(() => {
    if (propBotId) {
      setSelectedBotId(propBotId);
    } else if (isSignedIn && isLoaded && !loadingBots && bots.length > 0) {
      const botToUse = selectedBotId && bots.some(b => b.id === selectedBotId)
        ? selectedBotId
        : bots[0].id;
      setSelectedBotId(botToUse);
    }
  }, [propBotId, isSignedIn, isLoaded, loadingBots, bots, selectedBotId, setSelectedBotId]);

  // Deterministically check if we need to load chat
  // Load if: bot doesn't match OR (no session and no messages)
  useEffect(() => {
    if (actualBotId && isSignedIn && isLoaded && !loadingBots && !loadingMessages) {
      const botMismatch = currentBotId !== actualBotId;
      const needsLoad = botMismatch || (currentSessionId === null && messages.length === 0);
      
      if (needsLoad) {
        // If bot matches but we need a session, try to use current session or create new one
        const sessionToLoad = (!botMismatch && currentSessionId) ? currentSessionId : undefined;
        loadChatHistory(actualBotId, sessionToLoad);
      }
    }
  }, [actualBotId, isSignedIn, isLoaded, loadingBots, loadingMessages, currentBotId, currentSessionId, messages.length, loadChatHistory]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSessionSelect = async (sessionId: number) => {
    if (sessionId === currentSessionId || !actualBotId) return;
    await loadChatHistory(actualBotId, sessionId);
  };

  const handleNewSession = async () => {
    if (!actualBotId) return;
    try {
      const newSession = await ChatService.createSession(actualBotId);
      addSessionToBot(actualBotId, newSession);
      await loadChatHistory(actualBotId, newSession.id);
    } catch (error) {
      console.error('Error creating session:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !actualBotId) return;
    
    const message = input;
    setInput('');
    
    try {
      const result = await sendMessageToContext(actualBotId, message, currentSessionId || undefined);
      // If a new session was created, add it to BotContext and refresh sessions
      if (result.isNewSession && result.sessionId && actualBotId) {
        // Get session details from ChatService to add to BotContext
        try {
          const sessions = await ChatService.getSessions(actualBotId);
          const newSession = sessions.find(s => s.id === result.sessionId);
          if (newSession) {
            addSessionToBot(actualBotId, newSession);
          } else {
            // Fallback: refresh all sessions
            await refreshBotSessions(actualBotId);
          }
        } catch (error) {
          // Fallback: refresh all sessions if we can't get the new session
          await refreshBotSessions(actualBotId);
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const loading = loadingMessages || loadingSession;

  if (loadingBots) {
    return (
      <PageContainer>
        <div className="flex h-full">
          <div className="w-56 border-r border-border p-3">
            <Skeleton className="h-6 w-20 mb-3" />
            <SkeletonList count={5} />
          </div>
          <div className="flex-1 p-4">
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="space-y-4">
              <SkeletonMessage />
              <SkeletonMessage />
              <SkeletonMessage />
            </div>
          </div>
        </div>
      </PageContainer>
    );
  }

  if (!actualBotId) {
    return (
      <PageContainer>
        <div className="flex h-full items-center justify-center">
          <div className="text-text-secondary text-center">
            <p className="mb-2">No bots available.</p>
            <p className="text-sm text-text-tertiary">Please create a bot first.</p>
          </div>
        </div>
      </PageContainer>
    );
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
          <PageHeader title={botName} />
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          {messages
            .filter((msg) => msg.role !== 'system')
            .map((message, index) => (
              <MessageBubble
                key={index}
                message={message}
                onShowJson={(title, data) => setJsonModal({ isOpen: true, title, data })}
              />
            ))}
          {loading && (
            <div className="flex max-w-[80%] self-start">
              <div className="px-3 py-2 rounded-lg bg-message-assistant text-message-assistant-text text-sm">
                <div className="flex items-center gap-2">
                  <Skeleton className="w-2 h-2 rounded-full" />
                  <Skeleton className="w-2 h-2 rounded-full" />
                  <Skeleton className="w-2 h-2 rounded-full" />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
          </div>
          <form
          className="flex p-3 border-t border-border gap-2"
          onSubmit={handleSubmit}
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            disabled={loading}
            className="flex-1 h-8 px-3 border border-border-input rounded-md text-sm text-text-primary bg-background-secondary focus:outline-none focus:border-border-focus disabled:bg-disabled-bg disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="h-8 px-4 bg-primary text-text-inverse border-none rounded-md text-sm font-medium cursor-pointer transition-colors hover:bg-primary-hover disabled:bg-disabled disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
          >
            <IconSend className="w-4 h-4" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </form>
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

interface MessageBubbleProps {
  message: Message;
  onShowJson: (title: string, data: unknown) => void;
}

function MessageBubble({ message, onShowJson }: MessageBubbleProps) {
  const hasRawData = message.role === 'user' 
    ? message.rawRequest !== undefined
    : message.rawResponse !== undefined;

  return (
    <div
      className={`flex max-w-[80%] ${
        message.role === 'user' ? 'self-end' : 'self-start'
      }`}
    >
      <div
        className={`px-3 py-2 rounded-lg break-words text-sm relative group ${
          message.role === 'user'
            ? 'bg-message-user text-message-user-text'
            : 'bg-message-assistant text-message-assistant-text'
        }`}
      >
        <div className="pr-6">{message.content}</div>
        {hasRawData && (
          <button
            onClick={() => {
              if (message.role === 'user') {
                onShowJson('OpenAI Request', message.rawRequest);
              } else {
                onShowJson('OpenAI Response', message.rawResponse);
              }
            }}
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-black hover:bg-opacity-10"
            title={message.role === 'user' ? 'View request JSON' : 'View response JSON'}
          >
            <IconSearch className={`w-3.5 h-3.5 ${
              message.role === 'user' 
                ? 'text-message-user-text' 
                : 'text-message-assistant-text'
            }`} />
          </button>
        )}
      </div>
    </div>
  );
}

export default function ChatBot({ botId: propBotId }: ChatBotProps) {
  return (
    <ChatProvider>
      <ChatBotContent botId={propBotId} />
    </ChatProvider>
  );
}
