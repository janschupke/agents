import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../test/mocks/server';
import { UserService } from './user.service';
import { API_BASE_URL } from '../constants/api.constants';

describe('UserService', () => {
  describe('getCurrentUser', () => {
    it('should fetch current user successfully', async () => {
      const result = await UserService.getCurrentUser();

      expect(result).toMatchObject({
        id: 'user_123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
      });
    });

    it('should throw error when user not authenticated', async () => {
      server.use(
        http.get(`${API_BASE_URL}/api/user/me`, () => {
          return HttpResponse.json(
            { message: 'Unauthorized' },
            { status: 401 }
          );
        })
      );

      await expect(UserService.getCurrentUser()).rejects.toThrow();
    });

    it('should throw error when fetch fails', async () => {
      server.use(
        http.get(`${API_BASE_URL}/api/user/me`, () => {
          return HttpResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
          );
        })
      );

      await expect(UserService.getCurrentUser()).rejects.toThrow();
    });
  });
});
