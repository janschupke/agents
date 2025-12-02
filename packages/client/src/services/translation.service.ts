import { apiManager } from './api-manager.js';
import { WordTranslation } from '../types/chat.types.js';
import { API_ENDPOINTS } from '../constants/api.constants.js';

export class TranslationService {
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
