import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import ChatBot from './ChatBot';
import { ChatService } from '../../../../services/chat.service';
import { AuthProvider } from '../../../../contexts/AuthContext';
import { AppProvider } from '../../../../contexts/AppContext';
import { UserProvider } from '../../../../contexts/UserContext';
import { BotProvider } from '../../../../contexts/BotContext';
import { ChatProvider } from '../../../../contexts/ChatContext';
import { ToastProvider } from '../../../../contexts/ToastContext';
import { MessageRole } from '../../../../types/chat.types';

// Mock Clerk
vi.mock('@clerk/clerk-react', () => ({
  useUser: vi.fn(() => ({
    isSignedIn: true,
    isLoaded: true,
  })),
}));

// Mock the ChatService
vi.mock('../../../../services/chat.service', () => ({
  ChatService: {
    getChatHistory: vi.fn(),
    sendMessage: vi.fn(),
    getSessions: vi.fn().mockResolvedValue([{ id: 1, session_name: 'Session 1', bot_id: 1 }]),
  },
}));

// Mock BotService
vi.mock('../../../../services/bot.service', () => ({
  BotService: {
    getAllBots: vi
      .fn()
      .mockResolvedValue([{ id: 1, name: 'Test Bot', description: 'Test Description' }]),
  },
}));

// Mock UserService
vi.mock('../../../../services/user.service', () => ({
  UserService: {
    getCurrentUser: vi.fn().mockResolvedValue({ id: '1', email: 'test@example.com' }),
  },
}));

// Mock ApiCredentialsService
vi.mock('../../../../services/api-credentials.service', () => ({
  ApiCredentialsService: {
    hasOpenAIKey: vi.fn().mockResolvedValue(true),
  },
}));

// Mock scrollIntoView for jsdom
Object.defineProperty(Element.prototype, 'scrollIntoView', {
  value: vi.fn(),
  writable: true,
});

// Test wrapper with all providers
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <AuthProvider>
      <AppProvider>
        <UserProvider>
          <BotProvider>
            <ChatProvider>
              <ToastProvider>{children}</ToastProvider>
            </ChatProvider>
          </BotProvider>
        </UserProvider>
      </AppProvider>
    </AuthProvider>
  </BrowserRouter>
);

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

    render(
      <TestWrapper>
        <ChatBot botId={1} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Bot')).toBeInTheDocument();
    });
  });

  it('should display messages from chat history', async () => {
    const user = userEvent.setup();
    const mockSession = { id: 1, session_name: 'Session 1', bot_id: 1 };
    mockGetChatHistory.mockResolvedValue({
      bot: {
        id: 1,
        name: 'Test Bot',
        description: 'Test Description',
      },
      session: mockSession,
      messages: [
        { role: MessageRole.USER, content: 'Hello' },
        { role: MessageRole.ASSISTANT, content: 'Hi there!' },
      ],
    });

    render(
      <TestWrapper>
        <ChatBot botId={1} />
      </TestWrapper>
    );

    // Wait for bot to load
    await waitFor(() => {
      expect(screen.getByText('Test Bot')).toBeInTheDocument();
    });

    // Click on the session in the sidebar to select it
    await waitFor(() => {
      const sessionButton = screen.getByText('Session 1');
      expect(sessionButton).toBeInTheDocument();
    });

    const sessionButton = screen.getByText('Session 1');
    await user.click(sessionButton);

    // Wait for messages to load after session is selected
    await waitFor(
      () => {
        expect(screen.getByText('Hello')).toBeInTheDocument();
        expect(screen.getByText('Hi there!')).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it('should send message when form is submitted', async () => {
    const user = userEvent.setup();
    const mockSession = { id: 1, session_name: 'Session 1', bot_id: 1 };
    mockGetChatHistory.mockResolvedValue({
      bot: {
        id: 1,
        name: 'Test Bot',
        description: 'Test Description',
      },
      session: mockSession,
      messages: [],
    });

    mockSendMessage.mockResolvedValue({
      response: 'Test response',
      session: mockSession,
    });

    render(
      <TestWrapper>
        <ChatBot botId={1} />
      </TestWrapper>
    );

    // Wait for bot to load
    await waitFor(() => {
      expect(screen.getByText('Test Bot')).toBeInTheDocument();
    });

    // Click on the session in the sidebar to select it
    await waitFor(() => {
      const sessionButton = screen.getByText('Session 1');
      expect(sessionButton).toBeInTheDocument();
    });

    const sessionButton = screen.getByText('Session 1');
    await user.click(sessionButton);

    // Wait for chat input to appear after session is selected
    await waitFor(
      () => {
        expect(screen.getByPlaceholderText('Type your message...')).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    const input = screen.getByPlaceholderText('Type your message...');
    const sendButton = screen.getByRole('button', { name: /send/i });

    await user.type(input, 'Test message');
    await user.click(sendButton);

    await waitFor(() => {
      expect(mockSendMessage).toHaveBeenCalledWith(1, 'Test message', 1);
    });
  });

  it('should filter out system messages', async () => {
    const user = userEvent.setup();
    const mockSession = { id: 1, session_name: 'Session 1', bot_id: 1 };
    mockGetChatHistory.mockResolvedValue({
      bot: {
        id: 1,
        name: 'Test Bot',
        description: 'Test Description',
      },
      session: mockSession,
      messages: [
        { role: MessageRole.SYSTEM, content: 'System message' },
        { role: MessageRole.USER, content: 'User message' },
        { role: MessageRole.ASSISTANT, content: 'Assistant message' },
      ],
    });

    render(
      <TestWrapper>
        <ChatBot botId={1} />
      </TestWrapper>
    );

    // Wait for bot to load
    await waitFor(() => {
      expect(screen.getByText('Test Bot')).toBeInTheDocument();
    });

    // Click on the session in the sidebar to select it
    await waitFor(() => {
      const sessionButton = screen.getByText('Session 1');
      expect(sessionButton).toBeInTheDocument();
    });

    const sessionButton = screen.getByText('Session 1');
    await user.click(sessionButton);

    // Wait for messages to load after session is selected
    await waitFor(
      () => {
        expect(screen.queryByText('System message')).not.toBeInTheDocument();
        expect(screen.getByText('User message')).toBeInTheDocument();
        expect(screen.getByText('Assistant message')).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });
});
