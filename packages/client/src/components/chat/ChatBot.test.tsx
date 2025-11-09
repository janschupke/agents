import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChatBot from './ChatBot';
import { ChatService } from '../../services/chat.service';

// Mock the ChatService
vi.mock('../services/chat.service', () => ({
  ChatService: {
    getChatHistory: vi.fn(),
    sendMessage: vi.fn(),
  },
}));

describe('ChatBot', () => {
  const mockGetChatHistory = vi.mocked(ChatService.getChatHistory);
  const mockSendMessage = vi.mocked(ChatService.sendMessage);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render chat bot with bot name', async () => {
    mockGetChatHistory.mockResolvedValue({
      bot: {
        id: 1,
        name: 'Test Bot',
        description: 'Test Description',
      },
      session: {
        id: 1,
        session_name: 'Session 1',
      },
      messages: [],
    });

    render(<ChatBot botId={1} />);

    await waitFor(() => {
      expect(screen.getByText('Test Bot')).toBeInTheDocument();
    });
  });

  it('should display messages from chat history', async () => {
    mockGetChatHistory.mockResolvedValue({
      bot: {
        id: 1,
        name: 'Test Bot',
        description: 'Test Description',
      },
      session: {
        id: 1,
        session_name: 'Session 1',
      },
      messages: [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there!' },
      ],
    });

    render(<ChatBot botId={1} />);

    await waitFor(() => {
      expect(screen.getByText('Hello')).toBeInTheDocument();
      expect(screen.getByText('Hi there!')).toBeInTheDocument();
    });
  });

  it('should send message when form is submitted', async () => {
    const user = userEvent.setup();
    mockGetChatHistory.mockResolvedValue({
      bot: {
        id: 1,
        name: 'Test Bot',
        description: 'Test Description',
      },
      session: {
        id: 1,
        session_name: 'Session 1',
      },
      messages: [],
    });

    mockSendMessage.mockResolvedValue({
      response: 'Test response',
      session: {
        id: 1,
        session_name: 'Session 1',
      },
    });

    render(<ChatBot botId={1} />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Type your message...')).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText('Type your message...');
    const sendButton = screen.getByRole('button', { name: /send/i });

    await user.type(input, 'Test message');
    await user.click(sendButton);

    await waitFor(() => {
      expect(mockSendMessage).toHaveBeenCalledWith(1, 'Test message');
    });
  });

  it('should filter out system messages', async () => {
    mockGetChatHistory.mockResolvedValue({
      bot: {
        id: 1,
        name: 'Test Bot',
        description: 'Test Description',
      },
      session: {
        id: 1,
        session_name: 'Session 1',
      },
      messages: [
        { role: 'system', content: 'System message' },
        { role: 'user', content: 'User message' },
        { role: 'assistant', content: 'Assistant message' },
      ],
    });

    render(<ChatBot botId={1} />);

    await waitFor(() => {
      expect(screen.queryByText('System message')).not.toBeInTheDocument();
      expect(screen.getByText('User message')).toBeInTheDocument();
      expect(screen.getByText('Assistant message')).toBeInTheDocument();
    });
  });
});
