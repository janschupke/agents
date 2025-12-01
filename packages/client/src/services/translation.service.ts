import { apiManager } from './api-manager.js';

export class TranslationService {
  /**
   * Translate a message to English
   */
  static async translateMessage(messageId: number): Promise<string> {
    const response = await apiManager.post<{ translation: string }>(
      `/api/messages/${messageId}/translate`,
      {}
    );
    return response.translation;
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
    const ids = messageIds.join(',');
    return apiManager.get<Record<number, string>>(
      `/api/messages/translations?messageIds=${ids}`
    );
  }
}
