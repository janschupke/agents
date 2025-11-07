import './ChatBot.css';
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
    <div className="chatbot">
      <div className="chatbot-header">
        <h2>{botName}</h2>
      </div>
      <div className="chatbot-messages">
        {messages
          .filter((msg) => msg.role !== 'system')
          .map((message, index) => (
            <div
              key={index}
              className={`message message-${message.role}`}
            >
              <div className="message-content">{message.content}</div>
            </div>
          ))}
        {loading && (
          <div className="message message-assistant">
            <div className="message-content">Thinking...</div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <form className="chatbot-form" onSubmit={handleSubmit}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          disabled={loading}
          className="chatbot-input"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="chatbot-button"
        >
          Send
        </button>
      </form>
    </div>
  );
}
