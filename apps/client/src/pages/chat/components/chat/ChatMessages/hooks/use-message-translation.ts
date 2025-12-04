import { useState, useEffect } from 'react';
import { Message, MessageRole } from '../../../../../../types/chat.types';
import { TranslationService } from '../../../../../../services/translation/translation.service';
import { WordTranslationService } from '../../../../../../services/translation/word-translation.service';

interface UseMessageTranslationOptions {
  message: Message;
  messageId?: number;
}

interface UseMessageTranslationReturn {
  isTranslating: boolean;
  showTranslation: boolean;
  translation: string | undefined;
  wordTranslations:
    | import('../../../../../../types/chat.types').WordTranslation[]
    | undefined;
  handleTranslate: (e?: React.MouseEvent) => Promise<void>;
  setShowTranslation: (show: boolean) => void;
}

/**
 * Hook to manage message translation state and logic
 * Extracted from MessageBubble component
 */
export function useMessageTranslation({
  message,
  messageId,
}: UseMessageTranslationOptions): UseMessageTranslationReturn {
  const [isTranslating, setIsTranslating] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const [translation, setTranslation] = useState<string | undefined>(
    message.translation
  );
  const [wordTranslations, setWordTranslations] = useState(
    message.wordTranslations
  );

  // Sync translation state when message prop changes
  useEffect(() => {
    if (message.translation) {
      setTranslation(message.translation);
    }
    if (message.wordTranslations) {
      setWordTranslations(message.wordTranslations);
    }
  }, [message.translation, message.wordTranslations]);

  // Load parsed words and translations on mount if available (for assistant messages)
  useEffect(() => {
    if (
      messageId &&
      message.role === MessageRole.ASSISTANT &&
      !wordTranslations
    ) {
      // Check if parsed words or translations exist in the database
      WordTranslationService.getMessageTranslations(messageId)
        .then((result) => {
          // Load word translations even if they don't have translations yet (for highlighting)
          if (result.wordTranslations && result.wordTranslations.length > 0) {
            setWordTranslations(result.wordTranslations);
            message.wordTranslations = result.wordTranslations;
          }
          // Load full translation if available
          if (result.translation) {
            setTranslation(result.translation);
            message.translation = result.translation;
          }
        })
        .catch(() => {
          // Silently fail - translations are on-demand
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messageId]);

  const handleTranslate = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    // If translation exists (from initial response or previous request), just toggle
    if (translation !== undefined) {
      setShowTranslation(!showTranslation);
      return;
    }

    // Request translation on-demand (for user messages or assistant messages without translations)
    if (!messageId) {
      return;
    }

    setIsTranslating(true);
    try {
      if (message.role === MessageRole.ASSISTANT) {
        // For assistant messages, request word translations + full translation
        // Uses conversation context for better quality
        const result =
          await TranslationService.translateMessageWithWords(messageId);
        setTranslation(result.translation);
        setWordTranslations(result.wordTranslations);
        message.translation = result.translation;
        message.wordTranslations = result.wordTranslations;
        setShowTranslation(true);
      } else {
        // For user messages, request full translation only (no context)
        const translatedText =
          await TranslationService.translateMessage(messageId);
        setTranslation(translatedText);
        message.translation = translatedText;
        setShowTranslation(true);
      }
    } catch (error) {
      console.error('Translation failed:', error);
      // Show error to user (could use a toast notification)
    } finally {
      setIsTranslating(false);
    }
  };

  return {
    isTranslating,
    showTranslation,
    translation,
    wordTranslations,
    handleTranslate,
    setShowTranslation,
  };
}
