import { apiManager } from '../api/api-manager';
import { WordTranslation, Message } from '../../types/chat.types';
import { API_ENDPOINTS } from '../../constants/api.constants';

export class TranslationService {
  /**
   * Check if translation is available for a message
   */
  static hasTranslation(message: Message): boolean {
    return message.translation !== undefined;
  }

  /**
   * Check if word translations are available for a message
   */
  static hasWordTranslations(message: Message): boolean {
    return (
      message.wordTranslations !== undefined &&
      message.wordTranslations.length > 0
    );
  }

  /**
   * Translate a message to English
   */
  static async translateMessage(messageId: number): Promise<string> {
    const response = await apiManager.post<{ translation: string }>(
      API_ENDPOINTS.MESSAGES.TRANSLATE(messageId),
      {}
    );
    return response.translation;
  }

  /**
   * Translate a message with word-level translations (for assistant messages)
   */
  static async translateMessageWithWords(
    messageId: number
  ): Promise<{ translation: string; wordTranslations: WordTranslation[] }> {
    return apiManager.post<{
      translation: string;
      wordTranslations: WordTranslation[];
    }>(API_ENDPOINTS.MESSAGES.TRANSLATE_WITH_WORDS(messageId), {});
  }

  /**
   * Get translations for multiple messages
   */
  static async getTranslations(
    messageIds: number[]
  ): Promise<Record<number, string>> {
    if (messageIds.length === 0) {
      return {};
    }
    return apiManager.get<Record<number, string>>(
      API_ENDPOINTS.MESSAGES.TRANSLATIONS(messageIds)
    );
  }
}
