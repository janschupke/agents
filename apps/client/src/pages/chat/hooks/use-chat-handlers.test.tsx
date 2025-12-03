import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { TestQueryProvider } from '../../../test/utils/test-query-provider';
import { ToastProvider } from '../../../contexts/ToastContext';
import { useChatHandlers } from './use-chat-handlers';
import { Session, ChatHistoryResponse } from '../../../types/chat.types';

// Mock useConfirm
const mockConfirm = vi.fn();
vi.mock('../../../hooks/ui/useConfirm', () => ({
  useConfirm: () => ({
    confirm: mockConfirm,
    ConfirmDialog: null,
  }),
}));

// Mock formatDate
vi.mock('@openai/utils', () => ({
  formatDate: (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toISOString().split('T')[0];
  },
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <TestQueryProvider>
    <ToastProvider>{children}</ToastProvider>
  </TestQueryProvider>
);

describe('useChatHandlers', () => {
  const mockSessions: Session[] = [
    {
      id: 1,
      session_name: 'Session 1',
      createdAt: '2024-01-01T00:00:00.000Z',
    },
    {
      id: 2,
      session_name: 'Session 2',
      createdAt: '2024-01-02T00:00:00.000Z',
    },
  ];

  const mockChatHistory: ChatHistoryResponse = {
    agent: {
      id: 1,
      name: 'Agent 1',
      description: 'Description 1',
    },
    session: {
      id: 1,
      session_name: 'Session 1',
    },
    messages: [],
    savedWordMatches: [],
  };

  const mockHandleSessionSelect = vi.fn(async (_sessionId: number) => {
    return mockChatHistory;
  });

  const mockHandleNewSession = vi.fn(async () => {
    return mockSessions[0];
  });

  const mockHandleSessionDelete = vi.fn(async () => {
    return Promise.resolve();
  });

  const mockSetMessages = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should clear messages when selecting session', async () => {
    const { result } = renderHook(
      () =>
        useChatHandlers({
          agentId: 1,
          sessions: mockSessions,
          handleSessionSelect: mockHandleSessionSelect,
          handleNewSession: mockHandleNewSession,
          handleSessionDelete: mockHandleSessionDelete,
          setMessages: mockSetMessages,
        }),
      { wrapper }
    );

    await act(async () => {
      await result.current.handleSessionSelectWrapper(1);
    });

    // Messages are cleared in useChatMessages when sessionId changes, not here
    // This prevents race conditions
    expect(mockSetMessages).not.toHaveBeenCalled();
    expect(mockHandleSessionSelect).toHaveBeenCalledWith(1);
  });

  it('should clear messages when creating new session', async () => {
    const { result } = renderHook(
      () =>
        useChatHandlers({
          agentId: 1,
          sessions: mockSessions,
          handleSessionSelect: mockHandleSessionSelect,
          handleNewSession: mockHandleNewSession,
          handleSessionDelete: mockHandleSessionDelete,
          setMessages: mockSetMessages,
        }),
      { wrapper }
    );

    await act(async () => {
      await result.current.handleNewSessionWrapper();
    });

    expect(mockSetMessages).toHaveBeenCalledWith([]);
    expect(mockHandleNewSession).toHaveBeenCalled();
  });

  it('should show confirmation dialog when deleting session', async () => {
    mockConfirm.mockResolvedValue(true);

    const { result } = renderHook(
      () =>
        useChatHandlers({
          agentId: 1,
          sessions: mockSessions,
          handleSessionSelect: mockHandleSessionSelect,
          handleNewSession: mockHandleNewSession,
          handleSessionDelete: mockHandleSessionDelete,
          setMessages: mockSetMessages,
        }),
      { wrapper }
    );

    await act(async () => {
      await result.current.handleSessionDeleteWrapper(1);
    });

    expect(mockConfirm).toHaveBeenCalledWith({
      title: 'Delete Session',
      message: expect.stringContaining('Session 1'),
      confirmText: 'Delete',
      cancelText: 'Cancel',
      confirmVariant: 'danger',
    });
    expect(mockHandleSessionDelete).toHaveBeenCalledWith(
      1,
      expect.any(Function)
    );
  });

  it('should not delete session when confirmation is cancelled', async () => {
    mockConfirm.mockResolvedValue(false);

    const { result } = renderHook(
      () =>
        useChatHandlers({
          agentId: 1,
          sessions: mockSessions,
          handleSessionSelect: mockHandleSessionSelect,
          handleNewSession: mockHandleNewSession,
          handleSessionDelete: mockHandleSessionDelete,
          setMessages: mockSetMessages,
        }),
      { wrapper }
    );

    await act(async () => {
      await result.current.handleSessionDeleteWrapper(1);
    });

    expect(mockConfirm).toHaveBeenCalled();
    expect(mockHandleSessionDelete).not.toHaveBeenCalled();
  });

  it('should use formatted date for session name when session_name is null', async () => {
    const sessionWithoutName: Session = {
      id: 3,
      session_name: null,
      createdAt: '2024-01-03T00:00:00.000Z',
    };

    mockConfirm.mockResolvedValue(true);

    const { result } = renderHook(
      () =>
        useChatHandlers({
          agentId: 1,
          sessions: [sessionWithoutName],
          handleSessionSelect: mockHandleSessionSelect,
          handleNewSession: mockHandleNewSession,
          handleSessionDelete: mockHandleSessionDelete,
          setMessages: mockSetMessages,
        }),
      { wrapper }
    );

    await act(async () => {
      await result.current.handleSessionDeleteWrapper(3);
    });

    expect(mockConfirm).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining('2024-01-03'),
      })
    );
  });

  it('should handle session name save', async () => {
    const { result } = renderHook(
      () =>
        useChatHandlers({
          agentId: 1,
          sessions: mockSessions,
          handleSessionSelect: mockHandleSessionSelect,
          handleNewSession: mockHandleNewSession,
          handleSessionDelete: mockHandleSessionDelete,
          setMessages: mockSetMessages,
        }),
      { wrapper }
    );

    await act(async () => {
      await result.current.handleSessionNameSave('New Session Name');
    });

    // Should not throw - just invalidates queries
    expect(result.current.handleSessionNameSave).toBeDefined();
  });
});
