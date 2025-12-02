import { useState, useEffect } from 'react';
import { Message, MessageRole } from '../../../types/chat.types';
import { TranslationService } from '../../../services/translation.service';
import { WordTranslationService } from '../../../services/word-translation.service';

interface UseMessageTranslationOptions {
  message: Message;
  messageId?: number;
}

interface UseMessageTranslationReturn {
  isTranslating: boolean;
  showTranslation: boolean;
  translation: string | undefined;
  wordTranslations: import('../../../types/chat.types').WordTranslation[] | undefined;
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
  const [wordTranslations, setWordTranslations] = useState(message.wordTranslations);

  // Sync translation state when message prop changes
  useEffect(() => {
    if (message.translation) {
      setTranslation(message.translation);
    }
    if (message.wordTranslations) {
      setWordTranslations(message.wordTranslations);
    }
  }, [message.translation, message.wordTranslations]);

  // Load translations on mount if available (for assistant messages)
  useEffect(() => {
    if (messageId && message.role === MessageRole.ASSISTANT && !translation && !wordTranslations) {
      // Check if translations exist in the database
      WordTranslationService.getMessageTranslations(messageId)
        .then((result) => {
          if (result.translation && result.wordTranslations.length > 0) {
            setTranslation(result.translation);
            setWordTranslations(result.wordTranslations);
            // Update message object for parent state sync
            message.translation = result.translation;
            message.wordTranslations = result.wordTranslations;
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
    
    if (!messageId) return;

    // If translation exists, just toggle display
    if (translation !== undefined) {
      setShowTranslation(!showTranslation);
      return;
    }

    // Request translation (on-demand)
    setIsTranslating(true);
    try {
      if (message.role === MessageRole.ASSISTANT) {
        // For assistant messages, request word translations + full translation
        const result = await TranslationService.translateMessageWithWords(messageId);
        setTranslation(result.translation);
        setShowTranslation(true);
        
        // Update message with translations
        setWordTranslations(result.wordTranslations);
        message.translation = result.translation;
        message.wordTranslations = result.wordTranslations;
      } else {
        // For user messages, request full translation only
        const translatedText = await TranslationService.translateMessage(messageId);
        setTranslation(translatedText);
        setShowTranslation(true);
        
        // Update message in parent
        message.translation = translatedText;
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
