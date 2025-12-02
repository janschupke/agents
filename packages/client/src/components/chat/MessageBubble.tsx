import { Message, MessageRole } from '../../types/chat.types.js';
import { IconSearch, IconTranslate } from '../ui/Icons';
import TranslatableMarkdownContent from './TranslatableMarkdownContent';
import MarkdownContent from './MarkdownContent';
import { useState, useEffect } from 'react';
import { TranslationService } from '../../services/translation.service.js';
import FadeTransition from '../ui/FadeTransition.js';
import { WordTranslationService } from '../../services/word-translation.service.js';

interface MessageBubbleProps {
  message: Message;
  onShowJson: (title: string, data: unknown) => void;
  messageId?: number;
}

export default function MessageBubble({
  message,
  onShowJson,
  messageId,
}: MessageBubbleProps) {
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

  const hasRawData =
    message.role === MessageRole.USER
      ? message.rawRequest !== undefined
      : message.rawResponse !== undefined;

  const hasTranslation = translation !== undefined;

  const handleTranslate = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!messageId) return;

    // If translation exists, just toggle display
    if (hasTranslation) {
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

  return (
    <div className="flex flex-col">
      {/* Original message bubble */}
      <div
        className={`px-3 py-2 rounded-lg break-words text-sm relative group ${
          message.role === MessageRole.USER
            ? 'bg-message-user text-message-user-text'
            : 'bg-message-assistant text-message-assistant-text'
        }`}
      >
        <div className="markdown-wrapper">
          {message.role === MessageRole.ASSISTANT && wordTranslations && wordTranslations.length > 0 ? (
            <TranslatableMarkdownContent
              content={message.content}
              wordTranslations={wordTranslations}
            />
          ) : (
            <MarkdownContent content={message.content} />
          )}
        </div>

        {/* Action buttons container - overlay text with background when visible */}
        <div 
          className={`absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${
            message.role === MessageRole.USER
              ? 'bg-message-user'
              : 'bg-message-assistant'
          } rounded px-1 py-0.5`}
          style={{ pointerEvents: 'auto' }}
        >
          {/* Translation button */}
          <button
            onClick={handleTranslate}
            disabled={isTranslating || !messageId}
            className="p-1 rounded hover:bg-black hover:bg-opacity-10 disabled:opacity-50 disabled:cursor-not-allowed"
            title={
              isTranslating
                ? 'Translating...'
                : hasTranslation
                ? showTranslation
                  ? 'Hide translation'
                  : 'Show translation'
                : 'Click to translate'
            }
          >
            {isTranslating ? (
              <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <IconTranslate
                className={`w-3.5 h-3.5 ${
                  message.role === MessageRole.USER
                    ? 'text-message-user-text'
                    : 'text-message-assistant-text'
                }`}
              />
            )}
          </button>

          {/* JSON view button */}
          {hasRawData && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (message.role === MessageRole.USER) {
                  onShowJson('OpenAI Request', message.rawRequest);
                } else {
                  onShowJson('OpenAI Response', message.rawResponse);
                }
              }}
              className="p-1 rounded hover:bg-black hover:bg-opacity-10"
              title={
                message.role === MessageRole.USER
                  ? 'View request JSON'
                  : 'View response JSON'
              }
            >
              <IconSearch
                className={`w-3.5 h-3.5 ${
                  message.role === MessageRole.USER
                    ? 'text-message-user-text'
                    : 'text-message-assistant-text'
                }`}
              />
            </button>
          )}
        </div>
      </div>

      {/* Translation bubble - appears below original message */}
      {translation && (
        <FadeTransition show={showTranslation}>
          <div className="mt-2 px-3 py-2 rounded-lg break-words text-sm bg-background-secondary border border-border text-text-primary">
            <div className="text-xs font-semibold mb-1 text-text-tertiary uppercase tracking-wide">
              Translation
            </div>
            <div className="markdown-wrapper">
              <MarkdownContent content={translation} />
            </div>
          </div>
        </FadeTransition>
      )}
    </div>
  );
}
