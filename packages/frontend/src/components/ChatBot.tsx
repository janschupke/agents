import { useChat } from '../hooks/useChat.js';
import { ChatBotProps } from '../types/chat.types.js';
import SessionSidebar from './SessionSidebar.js';

export default function ChatBot({ botId }: ChatBotProps) {
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
  } = useChat({ botId });

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
        <div className="px-4 py-4 bg-background border-b border-border">
          <h2 className="text-xl font-semibold text-text-secondary">{botName}</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          {messages
            .filter((msg) => msg.role !== 'system')
            .map((message, index) => (
              <div
                key={index}
                className={`flex max-w-[80%] ${
                  message.role === 'user' ? 'self-end' : 'self-start'
                }`}
              >
                <div
                  className={`px-4 py-3 rounded-lg break-words ${
                    message.role === 'user'
                      ? 'bg-message-user text-message-user-text'
                      : 'bg-message-assistant text-message-assistant-text'
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
          {loading && (
            <div className="flex max-w-[80%] self-start">
              <div className="px-4 py-3 rounded-lg bg-message-assistant text-message-assistant-text">
                Thinking...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <form
          className="flex p-4 border-t border-border gap-2"
          onSubmit={handleSubmit}
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            disabled={loading}
            className="flex-1 px-3 py-3 border border-border-input rounded-md text-base text-text-primary bg-background-secondary focus:outline-none focus:border-border-focus disabled:bg-disabled-bg disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-6 py-3 bg-primary text-text-inverse border-none rounded-md text-base font-medium cursor-pointer transition-colors hover:bg-primary-hover disabled:bg-disabled disabled:cursor-not-allowed"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
