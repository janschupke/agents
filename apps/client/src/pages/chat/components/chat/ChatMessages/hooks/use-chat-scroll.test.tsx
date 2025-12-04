import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useChatScroll } from './use-chat-scroll';

describe('useChatScroll', () => {
  let mockScrollIntoView: ReturnType<typeof vi.fn>;
  let mockScrollTo: ReturnType<typeof vi.fn>;
  let mockScrollTop: number;
  let mockScrollHeight: number;
  let mockClientHeight: number;

  beforeEach(() => {
    mockScrollIntoView = vi.fn();
    mockScrollTo = vi.fn();
    mockScrollTop = 0;
    mockScrollHeight = 1000;
    mockClientHeight = 500;

    // Mock scrollIntoView
    Element.prototype.scrollIntoView = mockScrollIntoView;

    // Mock requestAnimationFrame
    global.requestAnimationFrame = vi.fn((cb) => {
      setTimeout(cb, 0);
      return 1;
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return messagesEndRef', () => {
    const { result } = renderHook(() =>
      useChatScroll({ messages: [], sessionId: null })
    );

    expect(result.current.messagesEndRef).toBeDefined();
    expect(result.current.messagesEndRef.current).toBeNull();
  });

  it('should scroll to bottom on initial load when messages appear', async () => {
    const messages = [{ id: 1 }, { id: 2 }];
    const container = document.createElement('div');
    container.scrollTop = 0;
    container.scrollHeight = 1000;
    container.clientHeight = 500;
    Object.defineProperty(container, 'scrollTop', {
      get: () => mockScrollTop,
      set: (val) => {
        mockScrollTop = val;
      },
      configurable: true,
    });
    Object.defineProperty(container, 'scrollHeight', {
      get: () => mockScrollHeight,
      configurable: true,
    });

    const messagesContainerRef = { current: container };

    const { result } = renderHook(() =>
      useChatScroll({
        messages,
        sessionId: 1,
        messagesContainerRef,
      })
    );

    await waitFor(() => {
      expect(mockScrollTop).toBe(mockScrollHeight);
    });
  });

  it('should scroll to bottom on new message if user is near bottom', async () => {
    const initialMessages = [{ id: 1 }];
    const container = document.createElement('div');
    // User is near bottom (within 200px)
    mockScrollTop = 800; // 1000 - 800 - 500 = -300, but we check < 200
    mockScrollHeight = 1000;
    mockClientHeight = 500;
    container.scrollTo = mockScrollTo;
    Object.defineProperty(container, 'scrollTop', {
      get: () => mockScrollTop,
      configurable: true,
    });
    Object.defineProperty(container, 'scrollHeight', {
      get: () => mockScrollHeight,
      configurable: true,
    });
    Object.defineProperty(container, 'clientHeight', {
      get: () => mockClientHeight,
      configurable: true,
    });

    const messagesContainerRef = { current: container };

    const { rerender } = renderHook(
      ({ messages: msgs }) =>
        useChatScroll({
          messages: msgs,
          sessionId: 1,
          messagesContainerRef,
        }),
      { initialProps: { messages: initialMessages } }
    );

    // Wait for initial load to complete
    await waitFor(() => {
      expect(mockScrollTop).toBe(mockScrollHeight);
    });

    // Add new message
    const newMessages = [...initialMessages, { id: 2 }];
    mockScrollHeight = 1200; // Height increased
    mockScrollTop = 900; // User scrolled a bit but still near bottom

    rerender({ messages: newMessages });

    await waitFor(() => {
      expect(mockScrollTo).toHaveBeenCalledWith({
        top: mockScrollHeight,
        behavior: 'smooth',
      });
    });
  });

  it('should NOT scroll to bottom on new message if user is scrolled up', async () => {
    const initialMessages = [{ id: 1 }];
    const container = document.createElement('div');
    // User is scrolled up (more than 200px from bottom)
    mockScrollTop = 100; // 1000 - 100 - 500 = 400px from bottom
    mockScrollHeight = 1000;
    mockClientHeight = 500;
    container.scrollTo = mockScrollTo;
    Object.defineProperty(container, 'scrollTop', {
      get: () => mockScrollTop,
      configurable: true,
    });
    Object.defineProperty(container, 'scrollHeight', {
      get: () => mockScrollHeight,
      configurable: true,
    });
    Object.defineProperty(container, 'clientHeight', {
      get: () => mockClientHeight,
      configurable: true,
    });

    const messagesContainerRef = { current: container };

    const { rerender } = renderHook(
      ({ messages: msgs }) =>
        useChatScroll({
          messages: msgs,
          sessionId: 1,
          messagesContainerRef,
        }),
      { initialProps: { messages: initialMessages } }
    );

    // Wait for initial load
    await waitFor(() => {
      expect(mockScrollTop).toBe(mockScrollHeight);
    });

    mockScrollTo.mockClear();

    // Add new message while user is scrolled up
    const newMessages = [...initialMessages, { id: 2 }];
    mockScrollHeight = 1200;
    mockScrollTop = 100; // Still scrolled up

    rerender({ messages: newMessages });

    // Wait a bit to ensure no scroll happens
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(mockScrollTo).not.toHaveBeenCalled();
  });

  it('should NOT scroll when loading older messages', async () => {
    const messages = [{ id: 1 }, { id: 2 }];
    const container = document.createElement('div');
    mockScrollTop = 500;
    mockScrollHeight = 1000;
    container.scrollTo = mockScrollTo;
    Object.defineProperty(container, 'scrollTop', {
      get: () => mockScrollTop,
      configurable: true,
    });
    Object.defineProperty(container, 'scrollHeight', {
      get: () => mockScrollHeight,
      configurable: true,
    });

    const messagesContainerRef = { current: container };

    const { rerender } = renderHook(
      ({ messages: msgs, isLoadingOlderMessages }) =>
        useChatScroll({
          messages: msgs,
          sessionId: 1,
          messagesContainerRef,
          isLoadingOlderMessages,
        }),
      { initialProps: { messages, isLoadingOlderMessages: false } }
    );

    // Wait for initial load
    await waitFor(() => {
      expect(mockScrollTop).toBe(mockScrollHeight);
    });

    mockScrollTo.mockClear();

    // Add messages while loading older messages
    const newMessages = [{ id: 0 }, ...messages]; // Older message added at start
    rerender({ messages: newMessages, isLoadingOlderMessages: true });

    // Wait a bit
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Should not scroll when loading older messages
    expect(mockScrollTo).not.toHaveBeenCalled();
  });

  it('should reset when sessionId changes', async () => {
    const messages = [{ id: 1 }];
    const container = document.createElement('div');
    mockScrollTop = 0;
    mockScrollHeight = 1000;
    Object.defineProperty(container, 'scrollTop', {
      get: () => mockScrollTop,
      set: (val) => {
        mockScrollTop = val;
      },
      configurable: true,
    });
    Object.defineProperty(container, 'scrollHeight', {
      get: () => mockScrollHeight,
      configurable: true,
    });

    const messagesContainerRef = { current: container };

    const { rerender } = renderHook(
      ({ sessionId, messages: msgs }) =>
        useChatScroll({
          messages: msgs,
          sessionId,
          messagesContainerRef,
        }),
      {
        initialProps: { sessionId: 1, messages },
      }
    );

    // Wait for initial load
    await waitFor(() => {
      expect(mockScrollTop).toBe(mockScrollHeight);
    });

    // Change sessionId - should reset and scroll again on new messages
    mockScrollTop = 0;
    rerender({ sessionId: 2, messages });

    // Add new message - should scroll (initial load for new session)
    const newMessages = [...messages, { id: 2 }];
    rerender({ sessionId: 2, messages: newMessages });

    await waitFor(() => {
      expect(mockScrollTop).toBe(mockScrollHeight);
    });
  });
});
