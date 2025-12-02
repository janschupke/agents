import { Message, MessageRole } from '../../../types/chat.types.js';
import { IconSearch, IconTranslate } from '../../../../components/ui/Icons';
import TranslatableMarkdownContent from '../markdown/TranslatableMarkdownContent';
import MarkdownContent from '../markdown/MarkdownContent';
import { FadeTransition } from '../../../../components/ui/animation';
import { useMessageTranslation } from '../../hooks/useMessageTranslation';

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
  const {
    isTranslating,
    showTranslation,
    translation,
    wordTranslations,
    handleTranslate,
  } = useMessageTranslation({ message, messageId });

  const hasRawData =
    message.role === MessageRole.USER
      ? message.rawRequest !== undefined
      : message.rawResponse !== undefined;

  const hasTranslation = translation !== undefined;

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
