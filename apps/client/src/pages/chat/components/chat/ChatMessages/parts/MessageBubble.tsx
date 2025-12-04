import { Message, MessageRole, Agent } from '../../../../../../types/chat.types';
import { SavedWordMatch } from '../../../../../../types/saved-word.types';
import {
  IconSearch,
  IconTranslate,
  FadeTransition,
  Button,
  Card,
  getSizeClasses,
} from '@openai/ui';
import { useTranslation, I18nNamespace } from '@openai/i18n';
import TranslatableMarkdownContent from '../../../markdown/TranslatableMarkdownContent/TranslatableMarkdownContent';
import MarkdownContent from '../../../markdown/MarkdownContent/MarkdownContent';
import { useMessageTranslation } from '../hooks/use-message-translation';
import { useLanguageAssistant } from '../../../../../../hooks/agent/use-language-assistant';

interface MessageBubbleProps {
  message: Message;
  savedWordMatches?: Map<string, SavedWordMatch>;
  onWordClick?: (
    word: string,
    translation: string,
    pinyin: string | null,
    savedWordId?: number,
    sentence?: string
  ) => void;
  agent?: Agent | null;
  onShowJson: (title: string, data: unknown) => void;
  messageId?: number;
}

export default function MessageBubble({
  message,
  savedWordMatches,
  onWordClick,
  onShowJson,
  messageId,
  agent,
}: MessageBubbleProps) {
  const { t } = useTranslation(I18nNamespace.CLIENT);
  const { isLanguageAssistant, language } = useLanguageAssistant(agent);
  const {
    isTranslating,
    showTranslation,
    translation,
    wordTranslations,
    handleTranslate,
  } = useMessageTranslation({ message, messageId });

  // Only enable translation features for language assistants
  const enableTranslation = isLanguageAssistant;

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
          {enableTranslation &&
          message.role === MessageRole.ASSISTANT &&
          wordTranslations &&
          wordTranslations.length > 0 ? (
            <TranslatableMarkdownContent
              content={message.content}
              wordTranslations={wordTranslations}
              savedWordMatches={savedWordMatches}
              onWordClick={onWordClick}
              language={language}
            />
          ) : (
            <MarkdownContent content={message.content} />
          )}
        </div>

        {/* Action buttons container - overlay text with background when visible */}
        {(enableTranslation || hasRawData) && (
        <div
          className={`absolute top-2 right-2 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ${
            message.role === MessageRole.USER
              ? 'bg-message-user'
              : 'bg-message-assistant'
          } rounded px-1 py-0.5`}
          style={{ pointerEvents: 'auto' }}
        >
          {/* Translation button - only for language assistants */}
          {enableTranslation && (
            <Button
              onClick={handleTranslate}
              disabled={isTranslating || !messageId}
              variant="message-bubble"
              size="xs"
              className="p-1"
              tooltip={
                isTranslating
                  ? t('chat.translation.translating')
                  : hasTranslation
                    ? showTranslation
                      ? t('chat.translation.hideTranslation')
                      : t('chat.translation.showTranslation')
                    : t('chat.translation.clickToTranslate')
              }
            >
              {isTranslating ? (
                <div className={`${getSizeClasses('xs').iconSize} border-2 border-current border-t-transparent rounded-full animate-spin`} />
              ) : (
                <IconTranslate size="xs" />
              )}
            </Button>
          )}

          {/* JSON view button - show for all agents if raw data exists */}
          {hasRawData && (
            <Button
              onClick={() => {
                if (message.role === MessageRole.USER) {
                  onShowJson(t('chat.openaiRequest'), message.rawRequest);
                } else {
                  onShowJson(t('chat.openaiResponse'), message.rawResponse);
                }
              }}
              variant="message-bubble"
              size="xs"
              className="p-1"
              tooltip={
                message.role === MessageRole.USER
                  ? t('chat.message.viewRequestJson')
                  : t('chat.message.viewResponseJson')
              }
            >
              <IconSearch size="xs" />
            </Button>
          )}
        </div>
        )}
      </div>

      {/* Translation bubble - appears below original message */}
      {enableTranslation && translation && (
        <FadeTransition show={showTranslation}>
          <Card
            variant="outlined"
            padding="sm"
            className="mt-2 break-words text-sm bg-background-secondary"
          >
            <div className="text-xs font-semibold mb-1 text-text-tertiary uppercase tracking-wide">
              {t('chat.translation.title')}
            </div>
            <div className="markdown-wrapper">
              <MarkdownContent content={translation} />
            </div>
          </Card>
        </FadeTransition>
      )}
    </div>
  );
}
