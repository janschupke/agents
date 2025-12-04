import { apiManager } from '../api/api-manager';
import {
  SavedWord,
  SavedWordMatch,
  SavedWordSentence,
  CreateSavedWordRequest,
  UpdateSavedWordRequest,
  AddSentenceRequest,
} from '../../types/saved-word.types';
import { API_ENDPOINTS } from '../../constants/api.constants';

export class SavedWordService {
  /**
   * Create a new saved word
   */
  static async createSavedWord(
    data: CreateSavedWordRequest
  ): Promise<SavedWord> {
    return apiManager.post<SavedWord>(API_ENDPOINTS.SAVED_WORDS.BASE, data);
  }

  /**
   * Get all saved words for current user, optionally filtered by language
   */
  static async getSavedWords(language?: string | null): Promise<SavedWord[]> {
    if (language) {
      return apiManager.get<SavedWord[]>(
        API_ENDPOINTS.SAVED_WORDS.BY_LANGUAGE(language)
      );
    }
    return apiManager.get<SavedWord[]>(API_ENDPOINTS.SAVED_WORDS.BASE);
  }

  /**
   * Get saved word by ID
   */
  static async getSavedWord(id: number): Promise<SavedWord> {
    return apiManager.get<SavedWord>(API_ENDPOINTS.SAVED_WORDS.BY_ID(id));
  }

  /**
   * Find matching saved words for a list of words
   */
  static async findMatchingWords(words: string[]): Promise<SavedWordMatch[]> {
    if (words.length === 0) {
      return [];
    }
    return apiManager.get<SavedWordMatch[]>(
      API_ENDPOINTS.SAVED_WORDS.MATCHING(words)
    );
  }

  /**
   * Update saved word
   */
  static async updateSavedWord(
    id: number,
    data: UpdateSavedWordRequest
  ): Promise<SavedWord> {
    return apiManager.patch<SavedWord>(
      API_ENDPOINTS.SAVED_WORDS.BY_ID(id),
      data
    );
  }

  /**
   * Delete saved word
   */
  static async deleteSavedWord(id: number): Promise<void> {
    await apiManager.delete(API_ENDPOINTS.SAVED_WORDS.BY_ID(id));
  }

  /**
   * Add sentence to saved word
   */
  static async addSentence(
    savedWordId: number,
    data: AddSentenceRequest
  ): Promise<SavedWordSentence> {
    return apiManager.post<SavedWordSentence>(
      API_ENDPOINTS.SAVED_WORDS.SENTENCES(savedWordId),
      data
    );
  }

  /**
   * Remove sentence from saved word
   */
  static async removeSentence(
    savedWordId: number,
    sentenceId: number
  ): Promise<void> {
    await apiManager.delete(
      API_ENDPOINTS.SAVED_WORDS.SENTENCE(savedWordId, sentenceId)
    );
  }
}
