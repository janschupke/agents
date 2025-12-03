import { apiManager } from '../api/api-manager';
import { API_ENDPOINTS } from '../../constants/api.constants';
import { User } from '../../types/chat.types';

export class UserService {
  /**
   * Get current user
   */
  static async getCurrentUser(): Promise<User> {
    return apiManager.get<User>(API_ENDPOINTS.USER.ME);
  }
}
