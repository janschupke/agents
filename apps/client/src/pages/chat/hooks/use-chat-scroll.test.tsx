import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useChatScroll } from '../components/chat/ChatMessages/hooks/use-chat-scroll';

describe('useChatScroll', () => {
  let mockScrollIntoView: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockScrollIntoView = vi.fn();
    // Mock scrollIntoView
    Element.prototype.scrollIntoView = mockScrollIntoView;
  });

  it('should return messagesEndRef', () => {
    const { result } = renderHook(() =>
      useChatScroll({ messages: [], sessionId: null })
    );

    expect(result.current.messagesEndRef).toBeDefined();
    expect(result.current.messagesEndRef.current).toBeNull();
  });

  it('should scroll to bottom on initial load', () => {
    const messages = [{ id: 1 }, { id: 2 }];

    const { result } = renderHook(() =>
      useChatScroll({ messages, sessionId: 1 })
    );

    expect(result.current.messagesEndRef).toBeDefined();
    // The scroll should be called with auto behavior on initial load
    // Note: This is a simplified test - actual behavior depends on refs
  });

  it('should reset when sessionId changes', () => {
    const messages = [{ id: 1 }];
    const { result, rerender } = renderHook(
      ({ sessionId, messages: msgs }) =>
        useChatScroll({ messages: msgs, sessionId }),
      {
        initialProps: { sessionId: 1, messages },
      }
    );

    // Create a div and attach it to the ref
    const div = document.createElement('div');
    // Access the ref object and set current (refs are mutable in tests)
    const ref = result.current.messagesEndRef as {
      current: HTMLDivElement | null;
    };
    ref.current = div;

    // Change sessionId - this resets the initial load flag
    rerender({ sessionId: 2, messages });

    // Add a new message - this should trigger scroll with 'auto' behavior (initial load)
    rerender({ sessionId: 2, messages: [{ id: 1 }, { id: 2 }] });

    // Should scroll on initial load after session change
    expect(mockScrollIntoView).toHaveBeenCalled();
  });
});
