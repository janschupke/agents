import { apiManager } from './api-manager.js';
import { API_ENDPOINTS } from '../constants/api.constants.js';
import { User } from '../types/user.types.js';

export interface UpdateUserRequest {
  email?: string;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
  roles?: string[];
}

export class UserService {
  static async getCurrentUser(): Promise<User> {
    return apiManager.get<User>(API_ENDPOINTS.USER_ME);
  }

  static async getAllUsers(): Promise<User[]> {
    return apiManager.get<User[]>(API_ENDPOINTS.USER_ALL);
  }

  static async getUserById(id: string): Promise<User> {
    return apiManager.get<User>(API_ENDPOINTS.USER_BY_ID(id));
  }

  static async updateUser(
    id: string,
    data: UpdateUserRequest
  ): Promise<User> {
    return apiManager.put<User>(API_ENDPOINTS.USER_BY_ID(id), data);
  }

  static async deleteUser(id: string): Promise<void> {
    return apiManager.delete<void>(API_ENDPOINTS.USER_BY_ID(id));
  }
}
