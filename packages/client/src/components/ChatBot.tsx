import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useChat } from '../hooks/useChat.js';
import { ChatBotProps, Message } from '../types/chat.types.js';
import SessionSidebar from './SessionSidebar.js';
import { IconSend, IconSearch } from './Icons';
import { Skeleton, SkeletonMessage, SkeletonList } from './Skeleton';
import JsonModal from './JsonModal.js';
import { useBots } from '../contexts/AppContext.js';

export default function ChatBot({ botId: propBotId }: ChatBotProps) {
  const { isSignedIn, isLoaded } = useUser();
  const [actualBotId, setActualBotId] = useState<number | undefined>(propBotId);
  const [loadingBot, setLoadingBot] = useState(!propBotId);
  const [jsonModal, setJsonModal] = useState<{
    isOpen: boolean;
    title: string;
    data: unknown;
  }>({ isOpen: false, title: '', data: null });

  const { bots, loadingBots } = useBots();

  useEffect(() => {
    if (!propBotId && isSignedIn && isLoaded) {
      if (!loadingBots && bots.length > 0 && !actualBotId) {
        setActualBotId(bots[0].id);
        setLoadingBot(false);
      } else if (!loadingBots && bots.length === 0) {
        setLoadingBot(false);
      } else if (loadingBots) {
        setLoadingBot(true);
      }
    } else if (propBotId) {
      setLoadingBot(false);
    }
  }, [propBotId, isSignedIn, isLoaded, loadingBots, bots, actualBotId]);

  const {
    messages,
    input,
    setInput,
    loading,
    botName,
    messagesEndRef,
    handleSubmit,
    sessions,
    currentSessionId,
    sessionsLoading,
    handleSessionSelect,
    handleNewSession,
  } = useChat({ botId: actualBotId });

  if (loadingBot) {
    return (
      <div className="flex w-full max-w-6xl h-[600px] bg-background-secondary rounded-lg shadow-lg overflow-hidden">
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
    );
  }

  if (!actualBotId) {
    return (
      <div className="flex w-full max-w-6xl h-[600px] bg-background-secondary rounded-lg shadow-lg overflow-hidden items-center justify-center">
        <div className="text-text-secondary text-center">
          <p className="mb-2">No bots available.</p>
          <p className="text-sm text-text-tertiary">Please create a bot first.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-6xl h-[600px] bg-background-secondary rounded-lg shadow-lg overflow-hidden">
      <SessionSidebar
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSessionSelect={handleSessionSelect}
        onNewSession={handleNewSession}
        loading={sessionsLoading}
      />
      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="px-4 py-2.5 bg-background border-b border-border">
          <h2 className="text-lg font-semibold text-text-secondary">{botName}</h2>
        </div>
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
      <JsonModal
        isOpen={jsonModal.isOpen}
        onClose={() => setJsonModal({ isOpen: false, title: '', data: null })}
        title={jsonModal.title}
        data={jsonModal.data}
      />
    </div>
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
