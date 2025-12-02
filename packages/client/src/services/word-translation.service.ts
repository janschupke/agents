import { apiManager } from './api-manager.js';
import { WordTranslation } from '../types/chat.types.js';

export class WordTranslationService {
  /**
   * Get word translations for a message
   */
  static async getWordTranslations(
    messageId: number
  ): Promise<WordTranslation[]> {
    const response = await apiManager.get<{ wordTranslations: WordTranslation[] }>(
      `/api/messages/${messageId}/word-translations`
    );
    return response.wordTranslations;
  }

  /**
   * Get both full translation and word translations for a message
   */
  static async getMessageTranslations(
    messageId: number
  ): Promise<{ translation?: string; wordTranslations: WordTranslation[] }> {
    return apiManager.get<{ translation?: string; wordTranslations: WordTranslation[] }>(
      `/api/messages/${messageId}/translations`
    );
  }
}
