import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserService } from './user.service';
import { apiManager } from './api-manager';
import { API_ENDPOINTS } from '../constants/api.constants';
import type { User } from '../types/user.types';

vi.mock('./api-manager');

describe('UserService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getCurrentUser', () => {
    it('should fetch current user from API', async () => {
      const mockUser: User = {
        id: 'user_1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        imageUrl: null,
        roles: ['user'],
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };

      vi.mocked(apiManager.get).mockResolvedValue(mockUser);

      const result = await UserService.getCurrentUser();

      expect(apiManager.get).toHaveBeenCalledWith(API_ENDPOINTS.USER_ME);
      expect(result).toEqual(mockUser);
    });
  });

  describe('getAllUsers', () => {
    it('should fetch all users from API', async () => {
      const mockUsers: User[] = [
        {
          id: 'user_1',
          email: 'test1@example.com',
          firstName: 'Test',
          lastName: 'User1',
          imageUrl: null,
          roles: ['user'],
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
        {
          id: 'user_2',
          email: 'test2@example.com',
          firstName: 'Test',
          lastName: 'User2',
          imageUrl: null,
          roles: ['admin'],
          createdAt: '2024-01-02T00:00:00.000Z',
          updatedAt: '2024-01-02T00:00:00.000Z',
        },
      ];

      vi.mocked(apiManager.get).mockResolvedValue(mockUsers);

      const result = await UserService.getAllUsers();

      expect(apiManager.get).toHaveBeenCalledWith(API_ENDPOINTS.USER_ALL);
      expect(result).toEqual(mockUsers);
    });
  });

  describe('getUserById', () => {
    it('should fetch user by id from API', async () => {
      const userId = 'user_1';
      const mockUser: User = {
        id: userId,
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        imageUrl: null,
        roles: ['user'],
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };

      vi.mocked(apiManager.get).mockResolvedValue(mockUser);

      const result = await UserService.getUserById(userId);

      expect(apiManager.get).toHaveBeenCalledWith(
        API_ENDPOINTS.USER_BY_ID(userId)
      );
      expect(result).toEqual(mockUser);
    });
  });

  describe('updateUser', () => {
    it('should update user via API', async () => {
      const userId = 'user_1';
      const updateData = {
        email: 'updated@example.com',
        firstName: 'Updated',
        lastName: 'User',
      };
      const updatedUser: User = {
        id: userId,
        email: updateData.email,
        firstName: updateData.firstName,
        lastName: updateData.lastName,
        imageUrl: null,
        roles: ['user'],
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };

      vi.mocked(apiManager.put).mockResolvedValue(updatedUser);

      const result = await UserService.updateUser(userId, updateData);

      expect(apiManager.put).toHaveBeenCalledWith(
        API_ENDPOINTS.USER_BY_ID(userId),
        updateData
      );
      expect(result).toEqual(updatedUser);
    });

    it('should update user roles', async () => {
      const userId = 'user_1';
      const updateData = {
        roles: ['admin', 'user'],
      };
      const updatedUser: User = {
        id: userId,
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        imageUrl: null,
        roles: ['admin', 'user'],
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };

      vi.mocked(apiManager.put).mockResolvedValue(updatedUser);

      const result = await UserService.updateUser(userId, updateData);

      expect(apiManager.put).toHaveBeenCalledWith(
        API_ENDPOINTS.USER_BY_ID(userId),
        updateData
      );
      expect(result).toEqual(updatedUser);
    });
  });

  describe('deleteUser', () => {
    it('should delete user via API', async () => {
      const userId = 'user_1';

      vi.mocked(apiManager.delete).mockResolvedValue(undefined);

      await UserService.deleteUser(userId);

      expect(apiManager.delete).toHaveBeenCalledWith(
        API_ENDPOINTS.USER_BY_ID(userId)
      );
    });
  });
});
