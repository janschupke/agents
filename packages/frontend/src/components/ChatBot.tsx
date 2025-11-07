import { useChat } from '../hooks/useChat.js';
import { ChatBotProps } from '../types/chat.types.js';

export default function ChatBot({ botId }: ChatBotProps) {
  const {
    messages,
    input,
    setInput,
    loading,
    botName,
    messagesEndRef,
    handleSubmit,
  } = useChat({ botId });

  return (
    <div className="flex flex-col w-full max-w-4xl h-[600px] bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="px-4 py-4 bg-gray-50 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800">{botName}</h2>
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
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-800'
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}
        {loading && (
          <div className="flex max-w-[80%] self-start">
            <div className="px-4 py-3 rounded-lg bg-gray-200 text-gray-800">
              Thinking...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <form
        className="flex p-4 border-t border-gray-200 gap-2"
        onSubmit={handleSubmit}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          disabled={loading}
          className="flex-1 px-3 py-3 border border-gray-300 rounded-md text-base focus:outline-none focus:border-blue-600 disabled:bg-gray-50 disabled:cursor-not-allowed"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-6 py-3 bg-blue-600 text-white border-none rounded-md text-base font-medium cursor-pointer transition-colors hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </form>
    </div>
  );
}
