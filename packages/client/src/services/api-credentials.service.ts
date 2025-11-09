import { apiManager } from './api-manager.js';
import { API_ENDPOINTS } from '../constants/api.constants.js';

export class ApiCredentialsService {
  /**
   * Check if user has OpenAI API key
   */
  static async hasOpenAIKey(): Promise<boolean> {
    try {
      const result = await apiManager.get<{ hasKey: boolean }>(
        API_ENDPOINTS.API_CREDENTIALS_OPENAI_CHECK
      );
      return result.hasKey;
    } catch (error) {
      console.error('Failed to check OpenAI key:', error);
      return false;
    }
  }

  /**
   * Set OpenAI API key
   */
  static async setOpenAIKey(apiKey: string): Promise<void> {
    await apiManager.post(API_ENDPOINTS.API_CREDENTIALS_OPENAI, { apiKey });
  }

  /**
   * Delete OpenAI API key
   */
  static async deleteOpenAIKey(): Promise<void> {
    await apiManager.delete(API_ENDPOINTS.API_CREDENTIALS_OPENAI);
  }
}
