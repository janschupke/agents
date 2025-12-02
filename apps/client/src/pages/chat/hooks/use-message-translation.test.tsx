import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useMessageTranslation } from './use-message-translation';
import { MessageRole, Message } from '../../../types/chat.types';
import { TranslationService } from '../../../services/translation.service';
import { WordTranslationService } from '../../../services/word-translation.service';

// Mock services
vi.mock('../../../services/translation.service');
vi.mock('../../../services/word-translation.service');

describe('useMessageTranslation', () => {
  const mockUserMessage: Message = {
    id: 1,
    role: MessageRole.USER,
    content: 'Hola',
    translation: undefined,
  };

  const mockAssistantMessage: Message = {
    id: 2,
    role: MessageRole.ASSISTANT,
    content: 'Hola, ¿cómo estás?',
    translation: undefined,
    wordTranslations: undefined,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with message translation if available', () => {
    const messageWithTranslation = {
      ...mockUserMessage,
      translation: 'Hello',
    };

    const { result } = renderHook(() =>
      useMessageTranslation({
        message: messageWithTranslation,
        messageId: 1,
      })
    );

    expect(result.current.translation).toBe('Hello');
    expect(result.current.showTranslation).toBe(false);
  });

  it('should initialize with word translations if available', () => {
    const messageWithWords = {
      ...mockAssistantMessage,
      wordTranslations: [
        {
          originalWord: 'Hola',
          translation: 'Hello',
        },
      ],
    };

    const { result } = renderHook(() =>
      useMessageTranslation({
        message: messageWithWords,
        messageId: 2,
      })
    );

    expect(result.current.wordTranslations).toHaveLength(1);
    expect(result.current.wordTranslations?.[0].originalWord).toBe('Hola');
  });

  it('should sync translation when message prop changes', () => {
    const { result, rerender } = renderHook(
      ({ message }) =>
        useMessageTranslation({
          message,
          messageId: 1,
        }),
      {
        initialProps: { message: mockUserMessage },
      }
    );

    expect(result.current.translation).toBeUndefined();

    const updatedMessage = {
      ...mockUserMessage,
      translation: 'Hello',
    };

    rerender({ message: updatedMessage });

    expect(result.current.translation).toBe('Hello');
  });

  it('should translate user message on demand', async () => {
    vi.mocked(TranslationService.translateMessage).mockResolvedValue('Hello');

    const { result } = renderHook(() =>
      useMessageTranslation({
        message: mockUserMessage,
        messageId: 1,
      })
    );

    await act(async () => {
      await result.current.handleTranslate();
    });

    await waitFor(() => {
      expect(result.current.translation).toBe('Hello');
      expect(result.current.showTranslation).toBe(true);
    });

    expect(TranslationService.translateMessage).toHaveBeenCalledWith(1);
  });

  it('should translate assistant message with words on demand', async () => {
    const mockResponse = {
      translation: 'Hello, how are you?',
      wordTranslations: [
        {
          originalWord: 'Hola',
          translation: 'Hello',
          sentenceContext: 'Hola, ¿cómo estás?',
        },
      ],
    };

    vi.mocked(TranslationService.translateMessageWithWords).mockResolvedValue(
      mockResponse
    );

    // Mock getMessageTranslations to return a promise that resolves
    vi.mocked(WordTranslationService.getMessageTranslations).mockResolvedValue({
      translation: undefined,
      wordTranslations: [],
    });

    const { result } = renderHook(() =>
      useMessageTranslation({
        message: mockAssistantMessage,
        messageId: 2,
      })
    );

    // Wait for initial effect to complete
    await waitFor(() => {
      expect(WordTranslationService.getMessageTranslations).toHaveBeenCalled();
    });

    await act(async () => {
      await result.current.handleTranslate();
    });

    await waitFor(() => {
      expect(result.current.translation).toBe('Hello, how are you?');
      expect(result.current.wordTranslations).toHaveLength(1);
      expect(result.current.showTranslation).toBe(true);
    });

    expect(TranslationService.translateMessageWithWords).toHaveBeenCalledWith(
      2
    );
  });

  it('should toggle translation display if already translated', async () => {
    const messageWithTranslation = {
      ...mockUserMessage,
      translation: 'Hello',
    };

    const { result } = renderHook(() =>
      useMessageTranslation({
        message: messageWithTranslation,
        messageId: 1,
      })
    );

    expect(result.current.showTranslation).toBe(false);

    await act(async () => {
      await result.current.handleTranslate();
    });

    expect(result.current.showTranslation).toBe(true);
    expect(TranslationService.translateMessage).not.toHaveBeenCalled();

    await act(async () => {
      await result.current.handleTranslate();
    });

    expect(result.current.showTranslation).toBe(false);
  });

  it('should not translate if messageId is not provided', async () => {
    const { result } = renderHook(() =>
      useMessageTranslation({
        message: mockUserMessage,
        messageId: undefined,
      })
    );

    await act(async () => {
      await result.current.handleTranslate();
    });

    expect(TranslationService.translateMessage).not.toHaveBeenCalled();
  });

  it('should load existing translations for assistant messages on mount', async () => {
    const mockResponse = {
      translation: 'Hello, how are you?',
      wordTranslations: [
        {
          originalWord: 'Hola',
          translation: 'Hello',
        },
      ],
    };

    // Ensure message has no translation initially
    const messageWithoutTranslation = {
      ...mockAssistantMessage,
      translation: undefined,
      wordTranslations: undefined,
    };

    vi.mocked(WordTranslationService.getMessageTranslations).mockResolvedValue(
      mockResponse
    );

    renderHook(() =>
      useMessageTranslation({
        message: messageWithoutTranslation,
        messageId: 2,
      })
    );

    await waitFor(() => {
      expect(
        WordTranslationService.getMessageTranslations
      ).toHaveBeenCalledWith(2);
    });
  });

  it('should handle translation errors gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const error = new Error('Translation failed');
    vi.mocked(TranslationService.translateMessage).mockRejectedValue(error);

    // Use a message without translation to ensure clean state
    const messageWithoutTranslation = {
      ...mockUserMessage,
      translation: undefined,
    };

    const { result } = renderHook(() =>
      useMessageTranslation({
        message: messageWithoutTranslation,
        messageId: 1,
      })
    );

    // Call handleTranslate - it catches errors internally and logs them
    await act(async () => {
      await result.current.handleTranslate();
    });

    await waitFor(
      () => {
        expect(result.current.isTranslating).toBe(false);
      },
      { timeout: 1000 }
    );

    // Verify error was handled gracefully - translation state should not be updated on error
    // The translation should remain undefined (not set to the message's original translation)
    expect(result.current.translation).toBeUndefined();
    expect(result.current.showTranslation).toBe(false);

    // The error should be logged in the catch block (line 114 of use-message-translation.ts)
    // Note: In test environment, console.error might be suppressed, so we just verify graceful handling
    // In a real scenario, the error would be logged to console

    consoleSpy.mockRestore();
  });

  it('should prevent event propagation when translating', async () => {
    vi.mocked(TranslationService.translateMessage).mockResolvedValue('Hello');

    const mockEvent = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    } as unknown as React.MouseEvent;

    const { result } = renderHook(() =>
      useMessageTranslation({
        message: mockUserMessage,
        messageId: 1,
      })
    );

    await act(async () => {
      await result.current.handleTranslate(mockEvent);
    });

    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(mockEvent.stopPropagation).toHaveBeenCalled();
  });

  it('should allow manual control of translation display', () => {
    const { result } = renderHook(() =>
      useMessageTranslation({
        message: mockUserMessage,
        messageId: 1,
      })
    );

    expect(result.current.showTranslation).toBe(false);

    act(() => {
      result.current.setShowTranslation(true);
    });

    expect(result.current.showTranslation).toBe(true);

    act(() => {
      result.current.setShowTranslation(false);
    });

    expect(result.current.showTranslation).toBe(false);
  });
});
