import { apiManager } from './api-manager.js';
import { API_ENDPOINTS } from '../constants/api.constants.js';
import { User } from '../types/user.types.js';

export class UserService {
  static async getCurrentUser(): Promise<User> {
    return apiManager.get<User>(API_ENDPOINTS.USER_ME);
  }

  static async getAllUsers(): Promise<User[]> {
    return apiManager.get<User[]>(API_ENDPOINTS.USER_ALL);
  }
}
