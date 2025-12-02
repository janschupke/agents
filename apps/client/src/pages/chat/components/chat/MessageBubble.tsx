import { Message, MessageRole } from '../../../../types/chat.types';
import {
  IconSearch,
  IconTranslate,
  FadeTransition,
  Button,
  ButtonVariant,
  Card,
} from '@openai/ui';
import { useTranslation, I18nNamespace } from '@openai/i18n';
import TranslatableMarkdownContent from '../markdown/TranslatableMarkdownContent';
import MarkdownContent from '../markdown/MarkdownContent';
import { useMessageTranslation } from '../../hooks/use-message-translation';

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
  const { t } = useTranslation(I18nNamespace.CLIENT);
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
          {message.role === MessageRole.ASSISTANT &&
          wordTranslations &&
          wordTranslations.length > 0 ? (
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
          <Button
            onClick={handleTranslate}
            disabled={isTranslating || !messageId}
            variant={ButtonVariant.ICON}
            size="sm"
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
          </Button>

          {/* JSON view button */}
          {hasRawData && (
            <Button
              onClick={() => {
                if (message.role === MessageRole.USER) {
                  onShowJson(t('chat.openaiRequest'), message.rawRequest);
                } else {
                  onShowJson(t('chat.openaiResponse'), message.rawResponse);
                }
              }}
              variant={ButtonVariant.ICON}
              size="sm"
              className="p-1"
              tooltip={
                message.role === MessageRole.USER
                  ? t('chat.message.viewRequestJson')
                  : t('chat.message.viewResponseJson')
              }
            >
              <IconSearch
                className={`w-3.5 h-3.5 ${
                  message.role === MessageRole.USER
                    ? 'text-message-user-text'
                    : 'text-message-assistant-text'
                }`}
              />
            </Button>
          )}
        </div>
      </div>

      {/* Translation bubble - appears below original message */}
      {translation && (
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
