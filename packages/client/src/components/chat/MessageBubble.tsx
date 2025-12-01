import { Message } from '../../types/chat.types.js';
import { IconSearch, IconTranslate } from '../ui/Icons';
import MarkdownContent from './MarkdownContent';
import { useState, useEffect } from 'react';
import { TranslationService } from '../../services/translation.service.js';

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

  // Sync translation state when message prop changes
  useEffect(() => {
    if (message.translation) {
      setTranslation(message.translation);
    }
  }, [message.translation]);

  const hasRawData =
    message.role === 'user'
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

    // Otherwise, fetch translation
    setIsTranslating(true);
    try {
      const translatedText = await TranslationService.translateMessage(
        messageId
      );
      setTranslation(translatedText);
      setShowTranslation(true);
      
      // Update message in parent (optional, for state sync)
      message.translation = translatedText;
    } catch (error) {
      console.error('Translation failed:', error);
      // Show error to user (could use a toast notification)
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <div className={`flex flex-col max-w-[80%] ${message.role === 'user' ? 'self-end' : 'self-start'}`}>
      {/* Original message bubble */}
      <div
        className={`px-3 py-2 rounded-lg break-words text-sm relative group ${
          message.role === 'user'
            ? 'bg-message-user text-message-user-text'
            : 'bg-message-assistant text-message-assistant-text'
        }`}
      >
        <div className="pr-12 markdown-wrapper">
          <MarkdownContent content={message.content} />
        </div>

        {/* Action buttons container - always clickable even when invisible */}
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" style={{ pointerEvents: 'auto' }}>
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
                  message.role === 'user'
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
                if (message.role === 'user') {
                  onShowJson('OpenAI Request', message.rawRequest);
                } else {
                  onShowJson('OpenAI Response', message.rawResponse);
                }
              }}
              className="p-1 rounded hover:bg-black hover:bg-opacity-10"
              title={
                message.role === 'user'
                  ? 'View request JSON'
                  : 'View response JSON'
              }
            >
              <IconSearch
                className={`w-3.5 h-3.5 ${
                  message.role === 'user'
                    ? 'text-message-user-text'
                    : 'text-message-assistant-text'
                }`}
              />
            </button>
          )}
        </div>
      </div>

      {/* Translation bubble - appears below original message */}
      {showTranslation && translation && (
        <div className="mt-2 px-3 py-2 rounded-lg break-words text-sm bg-background-secondary border border-border text-text-primary">
          <div className="text-xs font-semibold mb-1 text-text-tertiary uppercase tracking-wide">
            Translation
          </div>
          <div className="markdown-wrapper">
            <MarkdownContent content={translation} />
          </div>
        </div>
      )}
    </div>
  );
}
