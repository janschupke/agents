import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useChatInput } from './use-chat-input';
import { NUMERIC_CONSTANTS } from '../../../constants/numeric.constants';

// Mock ChatInputRef focus method
const mockFocus = vi.fn();
const mockChatInputRef = {
  current: {
    focus: mockFocus,
  },
};

// Mock useRef to return our mock ref
vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual,
    useRef: () => mockChatInputRef,
  };
});

describe('useChatInput', () => {
  const mockSendMessage = vi.fn(async (message: string) => {
    return {
      response: 'Response',
      session: { id: 1, session_name: 'Session 1' },
    };
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should initialize with empty input', () => {
    const { result } = renderHook(() =>
      useChatInput({
        currentSessionId: 1,
        messagesLoading: false,
        showChatPlaceholder: false,
        sendMessage: mockSendMessage,
      })
    );

    expect(result.current.input).toBe('');
  });

  it('should update input value', () => {
    const { result } = renderHook(() =>
      useChatInput({
        currentSessionId: 1,
        messagesLoading: false,
        showChatPlaceholder: false,
        sendMessage: mockSendMessage,
      })
    );

    act(() => {
      result.current.setInput('Hello');
    });

    expect(result.current.input).toBe('Hello');
  });

  it('should not submit empty message', async () => {
    const { result } = renderHook(() =>
      useChatInput({
        currentSessionId: 1,
        messagesLoading: false,
        showChatPlaceholder: false,
        sendMessage: mockSendMessage,
      })
    );

    const mockEvent = {
      preventDefault: vi.fn(),
    } as unknown as React.FormEvent;

    await act(async () => {
      await result.current.handleSubmit(mockEvent);
    });

    expect(mockSendMessage).not.toHaveBeenCalled();
  });

  it('should not submit whitespace-only message', async () => {
    const { result } = renderHook(() =>
      useChatInput({
        currentSessionId: 1,
        messagesLoading: false,
        showChatPlaceholder: false,
        sendMessage: mockSendMessage,
      })
    );

    act(() => {
      result.current.setInput('   ');
    });

    const mockEvent = {
      preventDefault: vi.fn(),
    } as unknown as React.FormEvent;

    await act(async () => {
      await result.current.handleSubmit(mockEvent);
    });

    expect(mockSendMessage).not.toHaveBeenCalled();
  });

  it('should submit message and clear input', async () => {
    const { result } = renderHook(() =>
      useChatInput({
        currentSessionId: 1,
        messagesLoading: false,
        showChatPlaceholder: false,
        sendMessage: mockSendMessage,
      })
    );

    act(() => {
      result.current.setInput('Hello');
    });

    const mockEvent = {
      preventDefault: vi.fn(),
    } as unknown as React.FormEvent;

    await act(async () => {
      await result.current.handleSubmit(mockEvent);
    });

    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(mockSendMessage).toHaveBeenCalledWith('Hello');
    expect(result.current.input).toBe('');
  });

  it('should focus input when session changes', async () => {
    // Use real timers for this test since fake timers are causing issues
    vi.useRealTimers();

    const { rerender } = renderHook(
      ({ currentSessionId }) =>
        useChatInput({
          currentSessionId,
          messagesLoading: false,
          showChatPlaceholder: false,
          sendMessage: mockSendMessage,
        }),
      {
        initialProps: { currentSessionId: null },
      }
    );

    // Change session
    rerender({ currentSessionId: 1 });

    // Wait for the debounce delay plus a small buffer
    await waitFor(
      () => {
        expect(mockFocus).toHaveBeenCalled();
      },
      { timeout: NUMERIC_CONSTANTS.UI_DEBOUNCE_DELAY + 100 }
    );

    // Restore fake timers
    vi.useFakeTimers();
  });

  it('should not focus input when messages are loading', () => {
    renderHook(() =>
      useChatInput({
        currentSessionId: 1,
        messagesLoading: true,
        showChatPlaceholder: false,
        sendMessage: mockSendMessage,
      })
    );

    act(() => {
      vi.advanceTimersByTime(NUMERIC_CONSTANTS.UI_DEBOUNCE_DELAY);
    });

    expect(mockFocus).not.toHaveBeenCalled();
  });

  it('should not focus input when showing placeholder', () => {
    renderHook(() =>
      useChatInput({
        currentSessionId: 1,
        messagesLoading: false,
        showChatPlaceholder: true,
        sendMessage: mockSendMessage,
      })
    );

    act(() => {
      vi.advanceTimersByTime(NUMERIC_CONSTANTS.UI_DEBOUNCE_DELAY);
    });

    expect(mockFocus).not.toHaveBeenCalled();
  });

  it('should handle send message error gracefully', async () => {
    const mockSendMessageError = vi.fn(async () => {
      throw new Error('Network error');
    });

    const { result } = renderHook(() =>
      useChatInput({
        currentSessionId: 1,
        messagesLoading: false,
        showChatPlaceholder: false,
        sendMessage: mockSendMessageError,
      })
    );

    // Verify result is not null before using it
    expect(result.current).not.toBeNull();
    
    act(() => {
      result.current.setInput('Hello');
    });

    const mockEvent = {
      preventDefault: vi.fn(),
    } as unknown as React.FormEvent;

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await act(async () => {
      await result.current.handleSubmit(mockEvent);
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to send message:',
      expect.any(Error)
    );

    consoleSpy.mockRestore();
  });
});
