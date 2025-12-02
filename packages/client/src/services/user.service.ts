import { apiManager } from './api-manager.js';
import { API_ENDPOINTS } from '../constants/api.constants.js';
import { User } from '../types/chat.types.js';

export class UserService {
  /**
   * Get current user
   */
  static async getCurrentUser(): Promise<User> {
    return apiManager.get<User>(API_ENDPOINTS.USER.ME);
  }
}
