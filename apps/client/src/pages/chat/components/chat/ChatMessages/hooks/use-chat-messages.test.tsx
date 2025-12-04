import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useChatMessages } from './use-chat-messages';
import { TestQueryProvider } from '../../../../../../test/utils/test-query-provider';
import {
  MessageRole,
  ChatHistoryResponse,
} from '../../../../../../types/chat.types';

// Mock dependencies
const mockUseChatHistory = vi.fn();
const mockSendMessage = vi.fn();
const mockFetchNextPage = vi.fn();
const mockInvalidateQueries = vi.fn();
const mockSetQueryData = vi.fn();

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

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query');
  return {
    ...actual,
    useQueryClient: () => ({
      invalidateQueries: mockInvalidateQueries,
      setQueryData: mockSetQueryData,
    }),
  };
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <TestQueryProvider>{children}</TestQueryProvider>
);

describe('useChatMessages', () => {
  const createMockPage = (
    messages: Array<{ id: number; role: MessageRole; content: string }>,
    hasMore: boolean = false
  ): ChatHistoryResponse => ({
    agent: {
      id: 1,
      name: 'Agent 1',
      description: null,
    },
    session: {
      id: 1,
      session_name: 'Session 1',
    },
    messages,
    savedWordMatches: [],
    hasMore,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchNextPage.mockResolvedValue(undefined);
    mockUseChatHistory.mockReturnValue({
      data: undefined,
      isLoading: false,
      isFetching: false,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with empty messages', () => {
    const { result } = renderHook(
      () => useChatMessages({ agentId: 1, sessionId: 1 }),
      { wrapper }
    );

    expect(result.current.messages).toEqual([]);
    expect(result.current.hasNextPage).toBe(false);
  });

  it('should combine pages into chronological message array', async () => {
    const chatHistory = createMockPage(
      [
        { id: 1, role: MessageRole.USER, content: 'Message 1' },
        { id: 2, role: MessageRole.ASSISTANT, content: 'Message 2' },
        { id: 3, role: MessageRole.USER, content: 'Message 3' },
        { id: 4, role: MessageRole.ASSISTANT, content: 'Message 4' },
      ],
      false
    );

    mockUseChatHistory.mockReturnValue({
      data: chatHistory,
      isLoading: false,
      isFetching: false,
    });

    const { result } = renderHook(
      () => useChatMessages({ agentId: 1, sessionId: 1 }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.messages.length).toBe(4);
    });

    // Messages should be in chronological order (oldest first)
    expect(result.current.messages[0].id).toBe(1);
    expect(result.current.messages[1].id).toBe(2);
    expect(result.current.messages[2].id).toBe(3);
    expect(result.current.messages[3].id).toBe(4);
  });

  it.skip('should load older messages when scrolling to top', async () => {
    // Skipped: useChatMessages doesn't support pagination - it uses useQuery, not useInfiniteQuery
    // The hook always loads all messages at once
    const page1 = createMockPage(
      [
        { id: 2, role: MessageRole.USER, content: 'Newer' },
        { id: 3, role: MessageRole.ASSISTANT, content: 'Newest' },
      ],
      true
    );

    mockUseChatHistory.mockReturnValue({
      data: page1,
      isLoading: false,
      isFetching: false,
    });

    const container = document.createElement('div');
    Object.defineProperty(container, 'scrollTop', {
      get: () => 0,
      configurable: true,
    });
    Object.defineProperty(container, 'scrollHeight', {
      get: () => 1000,
      configurable: true,
    });

    const { result } = renderHook(
      () => useChatMessages({ agentId: 1, sessionId: 1 }),
      { wrapper }
    );

    // Attach container ref
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (result.current.messagesContainerRef as any).current = container;

    // Simulate scroll to top
    await act(async () => {
      const scrollEvent = new Event('scroll');
      container.dispatchEvent(scrollEvent);
      await new Promise((resolve) => setTimeout(resolve, 150)); // Wait for debounce
    });

    await waitFor(() => {
      expect(mockFetchNextPage).toHaveBeenCalled();
    });
  });

  it.skip('should continue loading until hasMore is false when at top', async () => {
    // Skipped: useChatMessages doesn't support pagination - it uses useQuery, not useInfiniteQuery
    const pageCount = 1;
    const createPages = () => {
      const pages = [];
      for (let i = 0; i < pageCount; i++) {
        pages.push(
          createMockPage(
            [
              {
                id: i * 2 + 1,
                role: MessageRole.USER,
                content: `Message ${i * 2 + 1}`,
              },
              {
                id: i * 2 + 2,
                role: MessageRole.ASSISTANT,
                content: `Message ${i * 2 + 2}`,
              },
            ],
            pageCount < 3 // hasMore = true for first 2 pages
          )
        );
      }
      return pages;
    };

    mockUseChatHistory.mockImplementation(() => {
      const pages = createPages();
      // Combine all pages into a single response
      const allMessages = pages.flatMap((page) => page.messages);
      return {
        data: {
          agent: { id: 1, name: 'Agent 1', description: null },
          session: { id: 1, session_name: 'Session 1' },
          messages: allMessages,
          savedWordMatches: [],
          hasMore: pageCount < 3,
        },
        isLoading: false,
        isFetching: false,
      };
    });

    const container = document.createElement('div');
    container.scrollTop = 0;
    Object.defineProperty(container, 'scrollTop', {
      get: () => 0,
      configurable: true,
    });
    Object.defineProperty(container, 'scrollHeight', {
      get: () => 1000,
      configurable: true,
    });

    const { result, rerender } = renderHook(
      () => useChatMessages({ agentId: 1, sessionId: 1 }),
      { wrapper }
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (result.current.messagesContainerRef as any).current = container;

    // Trigger initial scroll
    await act(async () => {
      const scrollEvent = new Event('scroll');
      container.dispatchEvent(scrollEvent);
      await new Promise((resolve) => setTimeout(resolve, 150));
    });

    // Should load page 2
    await waitFor(() => {
      expect(pageCount).toBeGreaterThan(1);
    });

    // Rerender to get updated data
    rerender();

    // Should continue loading page 3
    await waitFor(
      () => {
        expect(pageCount).toBe(3);
      },
      { timeout: 2000 }
    );

    // After page 3, hasMore should be false, so no more loads
    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(pageCount).toBe(3); // Should not exceed 3
  });

  it.skip('should preserve scroll position when loading older messages', async () => {
    // Skipped: useChatMessages doesn't support pagination - it uses useQuery, not useInfiniteQuery
    const page1 = createMockPage(
      [
        { id: 2, role: MessageRole.USER, content: 'Newer' },
        { id: 3, role: MessageRole.ASSISTANT, content: 'Newest' },
      ],
      true
    );

    let scrollTop = 500;
    const container = document.createElement('div');
    Object.defineProperty(container, 'scrollTop', {
      get: () => scrollTop,
      set: (val) => {
        scrollTop = val;
      },
      configurable: true,
    });
    Object.defineProperty(container, 'scrollHeight', {
      get: () => 1000,
      configurable: true,
    });

    mockUseChatHistory.mockReturnValue({
      data: page1,
      isLoading: false,
      isFetching: false,
    });

    const { result, rerender } = renderHook(
      () => useChatMessages({ agentId: 1, sessionId: 1 }),
      { wrapper }
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (result.current.messagesContainerRef as any).current = container;

    // Simulate page 2 being loaded (scrollHeight increases)
    Object.defineProperty(container, 'scrollHeight', {
      get: () => 1500, // Increased by 500
      configurable: true,
    });

    // Update mock to return combined messages
    const combinedPage = createMockPage(
      [
        { id: 1, role: MessageRole.USER, content: 'Older' },
        { id: 2, role: MessageRole.USER, content: 'Newer' },
        { id: 3, role: MessageRole.ASSISTANT, content: 'Newest' },
      ],
      false
    );
    mockUseChatHistory.mockReturnValue({
      data: combinedPage,
      isLoading: false,
      isFetching: false,
    });

    rerender();

    await waitFor(() => {
      // Scroll position should be adjusted to maintain visual position
      // Initial: 500, Height increase: 500, New position: 500 + 500 = 1000
      expect(scrollTop).toBe(1000);
    });
  });

  it('should send message and invalidate queries', async () => {
    const mockResponse = {
      response: 'Assistant response',
      rawResponse: {},
      assistantMessageId: 3,
      userMessageId: 4,
      rawRequest: {},
      savedWordMatches: [],
    };

    mockSendMessage.mockResolvedValue(mockResponse);
    mockInvalidateQueries.mockResolvedValue(undefined);

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

    expect(mockInvalidateQueries).toHaveBeenCalled();
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
});
