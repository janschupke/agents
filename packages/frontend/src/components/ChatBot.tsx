import { useState, useEffect, useRef } from 'react';
import './ChatBot.css';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatBotProps {
  botId: number;
}

export default function ChatBot({ botId }: ChatBotProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [botName, setBotName] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadChatHistory();
  }, [botId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChatHistory = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${apiUrl}/api/chat/${botId}`);
      if (!response.ok) {
        throw new Error('Failed to load chat history');
      }
      const data = await response.json();
      setMessages(data.messages || []);
      setBotName(data.bot?.name || 'Chat Bot');
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${apiUrl}/api/chat/${botId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: input }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send message');
      }

      const data = await response.json();
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

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
