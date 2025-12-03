import { apiManager } from '../api/api-manager';
import { WordTranslation } from '../../types/chat.types';
import { API_ENDPOINTS } from '../../constants/api.constants';

export class WordTranslationService {
  /**
   * Get word translations for a message
   */
  static async getWordTranslations(
    messageId: number
  ): Promise<WordTranslation[]> {
    const response = await apiManager.get<{
      wordTranslations: WordTranslation[];
    }>(API_ENDPOINTS.MESSAGES.WORD_TRANSLATIONS(messageId));
    return response.wordTranslations;
  }

  /**
   * Get both full translation and word translations for a message
   */
  static async getMessageTranslations(
    messageId: number
  ): Promise<{ translation?: string; wordTranslations: WordTranslation[] }> {
    // Note: This endpoint doesn't match the backend exactly, but we'll use the translations endpoint
    // Backend has: GET /api/messages/:messageId/translations
    // For now, we'll construct it manually since it's not in our constants structure
    return apiManager.get<{
      translation?: string;
      wordTranslations: WordTranslation[];
    }>(`/api/messages/${messageId}/translations`);
  }
}
