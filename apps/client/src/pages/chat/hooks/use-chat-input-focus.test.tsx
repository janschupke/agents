import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useChatInputFocus } from './use-chat-input-focus';
import { ChatInputRef } from '../components/chat/ChatInput';

// Mock ChatInputRef focus method
const mockFocus = vi.fn();

// Mock requestAnimationFrame
const mockRequestAnimationFrame = vi.fn((callback: FrameRequestCallback) => {
  setTimeout(callback, 0);
  return 1;
});

global.requestAnimationFrame = mockRequestAnimationFrame;

describe('useChatInputFocus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFocus.mockClear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should focus on initial mount when conditions are met', () => {
    const chatInputRef = { current: { focus: mockFocus } } as React.RefObject<ChatInputRef>;
    
    renderHook(() =>
      useChatInputFocus({
        chatInputRef,
        currentSessionId: 1,
        messagesLoading: false,
        showChatPlaceholder: false,
        showTypingIndicator: false,
        isInputDisabled: false,
        agentId: 1,
      })
    );

    // requestAnimationFrame should be called
    expect(mockRequestAnimationFrame).toHaveBeenCalled();

    // Process the animation frame callback
    act(() => {
      vi.runAllTimers();
    });

    expect(mockFocus).toHaveBeenCalledTimes(1);
  });

  it('should not focus on initial mount when session is null', () => {
    const chatInputRef = { current: { focus: mockFocus } } as React.RefObject<ChatInputRef>;
    
    renderHook(() =>
      useChatInputFocus({
        chatInputRef,
        currentSessionId: null,
        messagesLoading: false,
        showChatPlaceholder: false,
        showTypingIndicator: false,
        isInputDisabled: false,
        agentId: null,
      })
    );

    act(() => {
      vi.runAllTimers();
    });

    expect(mockFocus).not.toHaveBeenCalled();
  });

  it('should not focus on initial mount when messages are loading', () => {
    const chatInputRef = { current: { focus: mockFocus } } as React.RefObject<ChatInputRef>;
    
    renderHook(() =>
      useChatInputFocus({
        chatInputRef,
        currentSessionId: 1,
        messagesLoading: true,
        showChatPlaceholder: false,
        showTypingIndicator: false,
        isInputDisabled: false,
        agentId: 1,
      })
    );

    act(() => {
      vi.runAllTimers();
    });

    expect(mockFocus).not.toHaveBeenCalled();
  });

  it('should not focus on initial mount when placeholder is showing', () => {
    const chatInputRef = { current: { focus: mockFocus } } as React.RefObject<ChatInputRef>;
    
    renderHook(() =>
      useChatInputFocus({
        chatInputRef,
        currentSessionId: 1,
        messagesLoading: false,
        showChatPlaceholder: true,
        showTypingIndicator: false,
        isInputDisabled: false,
        agentId: 1,
      })
    );

    act(() => {
      vi.runAllTimers();
    });

    expect(mockFocus).not.toHaveBeenCalled();
  });

  it('should not focus on initial mount when input is disabled', () => {
    const chatInputRef = { current: { focus: mockFocus } } as React.RefObject<ChatInputRef>;
    
    renderHook(() =>
      useChatInputFocus({
        chatInputRef,
        currentSessionId: 1,
        messagesLoading: false,
        showChatPlaceholder: false,
        showTypingIndicator: true,
        isInputDisabled: true,
        agentId: 1,
      })
    );

    act(() => {
      vi.runAllTimers();
    });

    expect(mockFocus).not.toHaveBeenCalled();
  });

  it('should focus when session changes', () => {
    // Create a stable ref that persists across renders
    const stableRef = { current: { focus: mockFocus } } as React.RefObject<ChatInputRef>;
    
    const { rerender } = renderHook<
      ReturnType<typeof useChatInputFocus>,
      { currentSessionId: number | null }
    >(
      ({ currentSessionId }) =>
        useChatInputFocus({
          chatInputRef: stableRef,
          currentSessionId,
          messagesLoading: false,
          showChatPlaceholder: false,
          showTypingIndicator: false,
          isInputDisabled: false,
          agentId: 1,
        }),
      {
        initialProps: { currentSessionId: null },
      }
    );

    // Initial mount with null session - should not focus
    act(() => {
      vi.runAllTimers();
    });
    expect(mockFocus).not.toHaveBeenCalled();
    mockFocus.mockClear();

    // Change session - should focus
    // Note: When changing from null to 1, initial mount effect may fire if conditions are now met
    // This is expected behavior - the important thing is that focus happens
    rerender({ currentSessionId: 1 });
    act(() => {
      vi.runAllTimers();
    });
    // Should focus (may be called multiple times by different effects, but that's acceptable)
    expect(mockFocus).toHaveBeenCalled();

    // Change session again - should focus again
    mockFocus.mockClear();
    rerender({ currentSessionId: 2 });
    act(() => {
      vi.runAllTimers();
    });
    expect(mockFocus).toHaveBeenCalled();
  });

  it('should focus when typing indicator goes from true to false', () => {
    const chatInputRef = { current: { focus: mockFocus } } as React.RefObject<ChatInputRef>;
    
    const { rerender } = renderHook<
      ReturnType<typeof useChatInputFocus>,
      { showTypingIndicator: boolean; isInputDisabled: boolean }
    >(
      ({ showTypingIndicator, isInputDisabled }) =>
        useChatInputFocus({
          chatInputRef,
          currentSessionId: 1,
          messagesLoading: false,
          showChatPlaceholder: false,
          showTypingIndicator,
          isInputDisabled,
          agentId: 1,
        }),
      {
        initialProps: { showTypingIndicator: true, isInputDisabled: true },
      }
    );

    // Initial mount with typing indicator true - should not focus (disabled)
    act(() => {
      vi.runAllTimers();
    });
    expect(mockFocus).not.toHaveBeenCalled();
    mockFocus.mockClear();

    // Change typing indicator to false - should focus
    rerender({ showTypingIndicator: false, isInputDisabled: false });
    act(() => {
      vi.runAllTimers();
    });
    // May be called multiple times (initial mount + typing indicator transition), but should focus
    expect(mockFocus).toHaveBeenCalled();
  });

  it('should focus when input goes from disabled to enabled', () => {
    const chatInputRef = { current: { focus: mockFocus } } as React.RefObject<ChatInputRef>;
    
    const { rerender } = renderHook<
      ReturnType<typeof useChatInputFocus>,
      { isInputDisabled: boolean }
    >(
      ({ isInputDisabled }) =>
        useChatInputFocus({
          chatInputRef,
          currentSessionId: 1,
          messagesLoading: false,
          showChatPlaceholder: false,
          showTypingIndicator: isInputDisabled,
          isInputDisabled,
          agentId: 1,
        }),
      {
        initialProps: { isInputDisabled: true },
      }
    );

    // Initial mount with disabled input - should not focus
    act(() => {
      vi.runAllTimers();
    });
    expect(mockFocus).not.toHaveBeenCalled();
    mockFocus.mockClear();

    // Enable input - should focus
    rerender({ isInputDisabled: false });
    act(() => {
      vi.runAllTimers();
    });
    // May be called multiple times (initial mount + disabled transition), but should focus
    expect(mockFocus).toHaveBeenCalled();
  });

  it('should not focus when typing indicator goes from false to true', () => {
    const chatInputRef = { current: { focus: mockFocus } } as React.RefObject<ChatInputRef>;
    
    const { rerender } = renderHook<
      ReturnType<typeof useChatInputFocus>,
      { showTypingIndicator: boolean; isInputDisabled: boolean }
    >(
      ({ showTypingIndicator, isInputDisabled }) =>
        useChatInputFocus({
          chatInputRef,
          currentSessionId: 1,
          messagesLoading: false,
          showChatPlaceholder: false,
          showTypingIndicator,
          isInputDisabled,
          agentId: 1,
        }),
      {
        initialProps: { showTypingIndicator: false, isInputDisabled: false },
      }
    );

    // Initial mount - should focus
    act(() => {
      vi.runAllTimers();
    });
    expect(mockFocus).toHaveBeenCalled();
    mockFocus.mockClear();

    // Change typing indicator to true - should not focus
    rerender({ showTypingIndicator: true, isInputDisabled: true });
    act(() => {
      vi.runAllTimers();
    });
    expect(mockFocus).not.toHaveBeenCalled();
  });

  it('should not focus when session changes but conditions are not met', () => {
    // Create a stable ref that persists across renders
    const stableRef = { current: { focus: mockFocus } } as React.RefObject<ChatInputRef>;
    
    const { rerender } = renderHook<
      ReturnType<typeof useChatInputFocus>,
      { currentSessionId: number | null; messagesLoading: boolean }
    >(
      ({ currentSessionId, messagesLoading }) =>
        useChatInputFocus({
          chatInputRef: stableRef,
          currentSessionId,
          messagesLoading,
          showChatPlaceholder: false,
          showTypingIndicator: false,
          isInputDisabled: false,
          agentId: 1,
        }),
      {
        initialProps: { currentSessionId: null, messagesLoading: true },
      }
    );

    // Change session but messages are still loading - should not focus
    rerender({ currentSessionId: 1, messagesLoading: true });
    act(() => {
      vi.runAllTimers();
    });
    expect(mockFocus).not.toHaveBeenCalled();
  });

  it('should handle ref not being ready gracefully', () => {
    const nullRef = { current: null } as React.RefObject<ChatInputRef>;

    renderHook(() =>
      useChatInputFocus({
        chatInputRef: nullRef,
        currentSessionId: 1,
        messagesLoading: false,
        showChatPlaceholder: false,
        showTypingIndicator: false,
        isInputDisabled: false,
        agentId: 1,
      })
    );

    act(() => {
      vi.runAllTimers();
    });

    // Should not throw, just not call focus
    expect(mockFocus).not.toHaveBeenCalled();
  });

  it('should not focus multiple times on initial mount', () => {
    const chatInputRef = { current: { focus: mockFocus } } as React.RefObject<ChatInputRef>;
    
    const { rerender } = renderHook(
      () =>
        useChatInputFocus({
          chatInputRef,
          currentSessionId: 1,
          messagesLoading: false,
          showChatPlaceholder: false,
          showTypingIndicator: false,
          isInputDisabled: false,
          agentId: 1,
        })
    );

    act(() => {
      vi.runAllTimers();
    });

    // Should focus at least once (may be called by initial mount effect)
    expect(mockFocus).toHaveBeenCalled();

    // Rerender with same props - should not focus again (initial mount already happened)
    mockFocus.mockClear();
    rerender();

    act(() => {
      vi.runAllTimers();
    });

    // Should not focus again on rerender with same props
    expect(mockFocus).not.toHaveBeenCalled();
  });
});
