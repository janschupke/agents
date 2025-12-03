import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useChatMessages } from './use-chat-messages';
import { TestQueryProvider } from '../../../../../../test/utils/test-query-provider';
import { MessageRole, ChatHistoryResponse } from '../../../../../../types/chat.types';

// Mock dependencies
const mockUseChatHistory = vi.fn();
const mockSendMessage = vi.fn();

vi.mock('../../../../../../hooks/queries/use-chat', () => ({
  useChatHistory: (agentId: number | null, sessionId: number | null) =>
    mockUseChatHistory(agentId, sessionId),
}));

vi.mock('../../../../../../hooks/mutations/use-chat-mutations', () => ({
  useSendMessage: () => ({
    mutateAsync: mockSendMessage,
    isPending: false,
  }),
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <TestQueryProvider>{children}</TestQueryProvider>
);

describe('useChatMessages', () => {
  const mockChatHistory: ChatHistoryResponse = {
    agent: {
      id: 1,
      name: 'Agent 1',
      description: null,
    },
    session: {
      id: 1,
      session_name: 'Session 1',
    },
    messages: [
      {
        role: MessageRole.USER,
        content: 'Hello',
        id: 1,
      },
      {
        role: MessageRole.ASSISTANT,
        content: 'Hi there!',
        id: 2,
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseChatHistory.mockReturnValue({
      data: null,
      isLoading: false,
      isFetching: false,
    });
  });

  it('should initialize with empty messages', () => {
    const { result } = renderHook(
      () => useChatMessages({ agentId: 1, sessionId: 1 }),
      { wrapper }
    );

    expect(result.current.messages).toEqual([]);
  });

  it('should update messages from chat history', async () => {
    mockUseChatHistory.mockReturnValue({
      data: mockChatHistory,
      isLoading: false,
      isFetching: false,
    });

    const { result } = renderHook(
      () => useChatMessages({ agentId: 1, sessionId: 1 }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.messages.length).toBeGreaterThan(0);
    });

    expect(result.current.messages).toEqual(mockChatHistory.messages);
  });

  it('should clear messages when sessionId changes', async () => {
    mockUseChatHistory.mockReturnValue({
      data: mockChatHistory,
      isLoading: false,
      isFetching: false,
    });

    const { result, rerender } = renderHook(
      ({ sessionId }) => useChatMessages({ agentId: 1, sessionId }),
      {
        initialProps: { sessionId: 1 },
        wrapper,
      }
    );

    await waitFor(() => {
      expect(result.current.messages.length).toBeGreaterThan(0);
    });

    rerender({ sessionId: 2 });

    expect(result.current.messages).toEqual([]);
  });

  it('should send message and update messages', async () => {
    const mockResponse = {
      response: 'Assistant response',
      rawResponse: {},
      assistantMessageId: 3,
      userMessageId: 4,
      rawRequest: {},
    };

    mockSendMessage.mockResolvedValue(mockResponse);

    const { result } = renderHook(
      () => useChatMessages({ agentId: 1, sessionId: 1 }),
      { wrapper }
    );

    await act(async () => {
      await result.current.sendMessage('Hello');
    });

    expect(mockSendMessage).toHaveBeenCalledWith({
      agentId: 1,
      message: 'Hello',
      sessionId: 1,
    });

    expect(result.current.messages.length).toBe(2);
    expect(result.current.messages[0].content).toBe('Hello');
    expect(result.current.messages[1].content).toBe('Assistant response');
  });

  it('should not send empty message', async () => {
    const { result } = renderHook(
      () => useChatMessages({ agentId: 1, sessionId: 1 }),
      { wrapper }
    );

    await act(async () => {
      const response = await result.current.sendMessage('   ');
      expect(response).toBeUndefined();
    });

    expect(mockSendMessage).not.toHaveBeenCalled();
  });

  it('should not send message when agentId is null', async () => {
    const { result } = renderHook(
      () => useChatMessages({ agentId: null, sessionId: 1 }),
      { wrapper }
    );

    await act(async () => {
      const response = await result.current.sendMessage('Hello');
      expect(response).toBeUndefined();
    });

    expect(mockSendMessage).not.toHaveBeenCalled();
  });

  it('should remove optimistic message on error', async () => {
    mockSendMessage.mockRejectedValue(new Error('Send failed'));

    const { result } = renderHook(
      () => useChatMessages({ agentId: 1, sessionId: 1 }),
      { wrapper }
    );

    await act(async () => {
      await expect(result.current.sendMessage('Hello')).rejects.toThrow();
    });

    expect(result.current.messages).toEqual([]);
  });
});
