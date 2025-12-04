import { MessageRole } from '../common/enums/message-role.enum';

export interface WordTranslation {
  originalWord: string;
  translation: string;
  sentenceContext?: string;
}

export interface TranslationContext {
  conversationHistory?: Array<{ role: string; content: string }>;
  messageRole: MessageRole;
}

export interface TranslationStrategy {
  /**
   * Translate a message with word-level translations
   */
  translateMessageWithWords(
    messageId: number,
    messageContent: string,
    apiKey: string,
    context?: TranslationContext
  ): Promise<{
    translation: string;
    wordTranslations: WordTranslation[];
  }>;
}
