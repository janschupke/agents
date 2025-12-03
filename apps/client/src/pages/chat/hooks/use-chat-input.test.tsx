import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useChatInput } from '../components/chat/ChatInput/hooks/use-chat-input';

// Mock the focus hook since we test it separately
vi.mock('../components/chat/ChatInput/hooks/use-chat-input-focus', () => ({
  useChatInputFocus: vi.fn(),
}));

describe('useChatInput', () => {
  const mockSendMessage = vi.fn(async (_message: string) => {
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
        agentId: 1,
        sendMessage: mockSendMessage,
      })
    );

    expect(result.current.input).toBe('');
  });

  it('should initialize with chatInputRef', () => {
    // Render hook with valid conditions on initial mount
    const { result } = renderHook(() =>
      useChatInput({
        currentSessionId: 1,
        messagesLoading: false,
        showChatPlaceholder: false,
        agentId: 1,
        sendMessage: mockSendMessage,
      })
    );

    // Verify the hook returns a ref
    expect(result.current.chatInputRef).toBeDefined();
    expect(result.current.chatInputRef.current).toBeNull(); // Initially null until ChatInput mounts
  });

  it('should pass correct props to useChatInputFocus', async () => {
    const { useChatInputFocus } = await import('../components/chat/ChatInput/hooks/use-chat-input-focus');
    
    const { rerender } = renderHook<
      ReturnType<typeof useChatInput>,
      { currentSessionId: number | null; messagesLoading: boolean }
    >(
      ({ currentSessionId, messagesLoading }) =>
        useChatInput({
          currentSessionId,
          messagesLoading,
          showChatPlaceholder: false,
          agentId: 1,
          sendMessage: mockSendMessage,
        }),
      {
        initialProps: {
          currentSessionId: null,
          messagesLoading: true,
        },
      }
    );

    // Verify useChatInputFocus was called with correct props
    expect(useChatInputFocus).toHaveBeenCalled();
    const lastCall = (useChatInputFocus as any).mock.calls[(useChatInputFocus as any).mock.calls.length - 1][0];
    expect(lastCall.currentSessionId).toBe(null);
    expect(lastCall.messagesLoading).toBe(true);

    // Update props
    rerender({
      currentSessionId: 1,
      messagesLoading: false,
    });

    // Verify useChatInputFocus was called again with updated props
    const updatedCall = (useChatInputFocus as any).mock.calls[(useChatInputFocus as any).mock.calls.length - 1][0];
    expect(updatedCall.currentSessionId).toBe(1);
    expect(updatedCall.messagesLoading).toBe(false);
  });

  // Focus behavior is tested in use-chat-input-focus.test.tsx
  // These tests verify that useChatInput correctly passes props to useChatInputFocus

  it('should update input value', () => {
    const { result } = renderHook(() =>
      useChatInput({
        currentSessionId: 1,
        messagesLoading: false,
        showChatPlaceholder: false,
        agentId: 1,
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
        agentId: 1,
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
        agentId: 1,
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
        agentId: 1,
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

  // Focus behavior is tested in use-chat-input-focus.test.tsx

  it('should handle send message error gracefully', async () => {
    const mockSendMessageError = vi.fn(async () => {
      throw new Error('Network error');
    });

    const { result } = renderHook(() =>
      useChatInput({
        currentSessionId: 1,
        messagesLoading: false,
        showChatPlaceholder: false,
        agentId: 1,
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

  // Focus behavior (including typing indicator) is tested in use-chat-input-focus.test.tsx
  // This test just verifies that useChatInput correctly passes showTypingIndicator to useChatInputFocus
  it('should pass showTypingIndicator to useChatInputFocus', async () => {
    const { useChatInputFocus } = await import('../components/chat/ChatInput/hooks/use-chat-input-focus');
    
    const { rerender } = renderHook<
      ReturnType<typeof useChatInput>,
      { showTypingIndicator: boolean }
    >(
      ({ showTypingIndicator }) =>
        useChatInput({
          currentSessionId: 1,
          messagesLoading: false,
          showChatPlaceholder: false,
          showTypingIndicator,
          agentId: 1,
          sendMessage: mockSendMessage,
        }),
      {
        initialProps: { showTypingIndicator: false },
      }
    );

    // Verify useChatInputFocus was called with showTypingIndicator
    expect(useChatInputFocus).toHaveBeenCalled();
    const lastCall = (useChatInputFocus as any).mock.calls[(useChatInputFocus as any).mock.calls.length - 1][0];
    expect(lastCall.showTypingIndicator).toBe(false);

    // Update showTypingIndicator
    rerender({ showTypingIndicator: true });

    // Verify useChatInputFocus was called again with updated showTypingIndicator
    const updatedCall = (useChatInputFocus as any).mock.calls[(useChatInputFocus as any).mock.calls.length - 1][0];
    expect(updatedCall.showTypingIndicator).toBe(true);
  });
});
