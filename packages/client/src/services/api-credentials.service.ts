import { apiManager } from './api-manager.js';
import { API_ENDPOINTS } from '../constants/api.constants.js';

export interface CredentialStatus {
  provider: string;
  hasKey: boolean;
}

export class ApiCredentialsService {
  /**
   * Get credentials status for all providers
   */
  static async getCredentialsStatus(): Promise<CredentialStatus[]> {
    return apiManager.get<CredentialStatus[]>(API_ENDPOINTS.API_CREDENTIALS_STATUS);
  }

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
