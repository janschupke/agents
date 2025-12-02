import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import ChatAgent from './ChatAgent';
import { AuthProvider } from '../../../../contexts/AuthContext';
import { AppProvider } from '../../../../contexts/AppContext';
import { ToastProvider } from '../../../../contexts/ToastContext';
import { TestQueryProvider } from '../../../../test/utils/test-query-provider';
import { MessageRole } from '../../../../types/chat.types';
import { server } from '../../../../test/mocks/server';
import { http, HttpResponse } from 'msw';
import { API_BASE_URL } from '../../../../constants/api.constants';

// Mock Clerk
vi.mock('@clerk/clerk-react', () => ({
  useUser: vi.fn(() => ({
    isSignedIn: true,
    isLoaded: true,
    user: {
      id: 'user_123',
      emailAddresses: [{ emailAddress: 'test@example.com' }],
    },
  })),
  useAuth: vi.fn(() => ({
    getToken: vi.fn().mockResolvedValue('mock-token'),
    isSignedIn: true,
    isLoaded: true,
  })),
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
      <TestQueryProvider>
        <AppProvider>
          <ToastProvider>{children}</ToastProvider>
        </AppProvider>
      </TestQueryProvider>
    </AuthProvider>
  </BrowserRouter>
);

describe('ChatAgent', () => {
  beforeEach(() => {
    // Set up MSW handlers for these tests
    server.use(
      http.get(`${API_BASE_URL}/api/agents`, () => {
        return HttpResponse.json([
          {
            id: 1,
            name: 'Test Agent',
            description: 'Test Description',
            avatarUrl: null,
            createdAt: '2024-01-01T00:00:00.000Z',
          },
        ]);
      }),
      http.get(`${API_BASE_URL}/api/agents/1`, () => {
        return HttpResponse.json({
          id: 1,
          name: 'Test Agent',
          description: 'Test Description',
          avatarUrl: null,
          createdAt: '2024-01-01T00:00:00.000Z',
        });
      }),
      http.get(`${API_BASE_URL}/api/chat/1/sessions`, () => {
        return HttpResponse.json([
          { id: 1, session_name: 'Session 1', agent_id: 1 },
        ]);
      }),
      http.get(`${API_BASE_URL}/api/user/me`, () => {
        return HttpResponse.json({
          id: 'user_123',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
        });
      }),
      http.get(`${API_BASE_URL}/api/api-credentials/openai/check`, () => {
        return HttpResponse.json({ hasKey: true });
      })
    );
  });

  afterEach(() => {
    // Ensure cleanup happens
    cleanup();
  });

  it('should render chat agent with agent name', async () => {
    server.use(
      http.get(`${API_BASE_URL}/api/chat/1`, () => {
        return HttpResponse.json({
          agent: {
            id: 1,
            name: 'Test Agent',
            description: 'Test Description',
          },
          session: {
            id: 1,
            session_name: 'Session 1',
          },
          messages: [],
        });
      })
    );

    render(
      <TestWrapper>
        <ChatAgent agentId={1} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Agent')).toBeInTheDocument();
    }, { timeout: 1000 });
  });

  it('should display messages from chat history', async () => {
    const user = userEvent.setup();
    
    server.use(
      http.get(`${API_BASE_URL}/api/chat/1`, ({ request }) => {
        const url = new URL(request.url);
        const sessionId = url.searchParams.get('sessionId');
        
        if (sessionId === '1') {
          return HttpResponse.json({
            agent: {
              id: 1,
              name: 'Test Agent',
              description: 'Test Description',
            },
            session: {
              id: 1,
              session_name: 'Session 1',
            },
            messages: [
              { id: 1, role: MessageRole.USER, content: 'Hello', createdAt: new Date().toISOString() },
              { id: 2, role: MessageRole.ASSISTANT, content: 'Hi there!', createdAt: new Date().toISOString() },
            ],
          });
        }
        
        return HttpResponse.json({
          bot: {
            id: 1,
            name: 'Test Agent',
            description: 'Test Description',
          },
          session: null,
          messages: [],
        });
      })
    );

    render(
      <TestWrapper>
        <ChatAgent agentId={1} />
      </TestWrapper>
    );

    // Wait for bot to load
    await waitFor(() => {
      expect(screen.getByText('Test Agent')).toBeInTheDocument();
    }, { timeout: 1000 });

    // Click on the session in the sidebar to select it
    await waitFor(() => {
      const sessionButton = screen.getByText('Session 1');
      expect(sessionButton).toBeInTheDocument();
    }, { timeout: 1000 });

    const sessionButton = screen.getByText('Session 1');
    await user.click(sessionButton);

    // Wait for messages to load after session is selected
    await waitFor(
      () => {
        expect(screen.getByText('Hello')).toBeInTheDocument();
        expect(screen.getByText('Hi there!')).toBeInTheDocument();
      },
      { timeout: 1000 }
    );
  });

  it('should send message when form is submitted', async () => {
    const user = userEvent.setup();
    
    let messageCount = 0;
    
    server.use(
      http.get(`${API_BASE_URL}/api/chat/1`, ({ request }) => {
        const url = new URL(request.url);
        const sessionId = url.searchParams.get('sessionId');
        
        if (sessionId === '1') {
          return HttpResponse.json({
            agent: {
              id: 1,
              name: 'Test Agent',
              description: 'Test Description',
            },
            session: {
              id: 1,
              session_name: 'Session 1',
            },
            messages: messageCount > 0 ? [
              { id: 1, role: MessageRole.USER, content: 'Test message', createdAt: new Date().toISOString() },
              { id: 2, role: MessageRole.ASSISTANT, content: 'Test response', createdAt: new Date().toISOString() },
            ] : [],
          });
        }
        
        return HttpResponse.json({
          bot: {
            id: 1,
            name: 'Test Agent',
            description: 'Test Description',
          },
          session: null,
          messages: [],
        });
      }),
      http.post(`${API_BASE_URL}/api/chat/1`, async ({ request }) => {
        messageCount++;
        const body = await request.json() as { message: string };
        return HttpResponse.json({
          response: 'Test response',
          session: {
            id: 1,
            session_name: 'Session 1',
          },
          userMessageId: 1,
          assistantMessageId: 2,
        });
      })
    );

    render(
      <TestWrapper>
        <ChatAgent agentId={1} />
      </TestWrapper>
    );

    // Wait for bot to load
    await waitFor(() => {
      expect(screen.getByText('Test Agent')).toBeInTheDocument();
    }, { timeout: 1000 });

    // Click on the session in the sidebar to select it
    await waitFor(() => {
      const sessionButton = screen.getByText('Session 1');
      expect(sessionButton).toBeInTheDocument();
    }, { timeout: 1000 });

    const sessionButton = screen.getByText('Session 1');
    await user.click(sessionButton);

    // Wait for chat input to appear after session is selected
    await waitFor(
      () => {
        expect(screen.getByPlaceholderText(/type your message/i)).toBeInTheDocument();
      },
      { timeout: 1000 }
    );

    const input = screen.getByPlaceholderText(/type your message/i);
    const sendButton = screen.getByRole('button', { name: /send/i });

    await user.type(input, 'Test message');
    await user.click(sendButton);

    // Wait for the message to appear
    await waitFor(
      () => {
        expect(screen.getByText('Test message')).toBeInTheDocument();
      },
      { timeout: 1000 }
    );
  });

  it('should filter out system messages', async () => {
    const user = userEvent.setup();
    
    server.use(
      http.get(`${API_BASE_URL}/api/chat/1`, ({ request }) => {
        const url = new URL(request.url);
        const sessionId = url.searchParams.get('sessionId');
        
        if (sessionId === '1') {
          return HttpResponse.json({
            agent: {
              id: 1,
              name: 'Test Agent',
              description: 'Test Description',
            },
            session: {
              id: 1,
              session_name: 'Session 1',
            },
            messages: [
              { id: 1, role: MessageRole.SYSTEM, content: 'System message', createdAt: new Date().toISOString() },
              { id: 2, role: MessageRole.USER, content: 'User message', createdAt: new Date().toISOString() },
              { id: 3, role: MessageRole.ASSISTANT, content: 'Assistant message', createdAt: new Date().toISOString() },
            ],
          });
        }
        
        return HttpResponse.json({
          bot: {
            id: 1,
            name: 'Test Agent',
            description: 'Test Description',
          },
          session: null,
          messages: [],
        });
      })
    );

    render(
      <TestWrapper>
        <ChatAgent agentId={1} />
      </TestWrapper>
    );

    // Wait for bot to load
    await waitFor(() => {
      expect(screen.getByText('Test Agent')).toBeInTheDocument();
    }, { timeout: 1000 });

    // Click on the session in the sidebar to select it
    await waitFor(() => {
      const sessionButton = screen.getByText('Session 1');
      expect(sessionButton).toBeInTheDocument();
    }, { timeout: 1000 });

    const sessionButton = screen.getByText('Session 1');
    await user.click(sessionButton);

    // Wait for messages to load after session is selected
    await waitFor(
      () => {
        expect(screen.queryByText('System message')).not.toBeInTheDocument();
        expect(screen.getByText('User message')).toBeInTheDocument();
        expect(screen.getByText('Assistant message')).toBeInTheDocument();
      },
      { timeout: 1000 }
    );
  });
});
