import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../../test/mocks/server';
import { SessionService } from './session.service';
import { API_BASE_URL } from '../../../constants/api.constants';

describe('SessionService', () => {
  describe('getSessions', () => {
    it('should fetch sessions successfully', async () => {
      const result = await SessionService.getSessions(1);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should throw error when fetch fails', async () => {
      server.use(
        http.get(`${API_BASE_URL}/api/agents/1/sessions`, () => {
          return HttpResponse.json({ message: 'Not found' }, { status: 404 });
        })
      );

      await expect(SessionService.getSessions(1)).rejects.toThrow();
    });
  });

  describe('createSession', () => {
    it('should create session successfully', async () => {
      const result = await SessionService.createSession(1);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
    });

    it('should throw error when create fails', async () => {
      server.use(
        http.post(`${API_BASE_URL}/api/agents/1/sessions`, () => {
          return HttpResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
          );
        })
      );

      await expect(SessionService.createSession(1)).rejects.toThrow();
    });
  });

  describe('updateSession', () => {
    it('should update session successfully', async () => {
      const result = await SessionService.updateSession(1, 1, 'New Name');

      expect(result).toBeDefined();
      expect(result.session_name).toBe('New Name');
    });

    it('should throw error when update fails', async () => {
      server.use(
        http.put(`${API_BASE_URL}/api/chat/1/1`, () => {
          return HttpResponse.json({ message: 'Not found' }, { status: 404 });
        })
      );

      await expect(
        SessionService.updateSession(1, 1, 'New Name')
      ).rejects.toThrow();
    });
  });

  describe('deleteSession', () => {
    it('should delete session successfully', async () => {
      await expect(
        SessionService.deleteSession(1, 1)
      ).resolves.toBeUndefined();
    });

    it('should throw error when delete fails', async () => {
      server.use(
        http.delete(`${API_BASE_URL}/api/chat/1/1`, () => {
          return HttpResponse.json({ message: 'Not found' }, { status: 404 });
        })
      );

      await expect(SessionService.deleteSession(1, 1)).rejects.toThrow();
    });
  });

  describe('getSessionWithAgent', () => {
    it('should fetch session with agent successfully', async () => {
      const result = await SessionService.getSessionWithAgent(1);

      expect(result).toBeDefined();
      expect(result.session).toBeDefined();
      expect(result.agentId).toBeDefined();
    });

    it('should throw error when fetch fails', async () => {
      server.use(
        http.get(`${API_BASE_URL}/api/sessions/1`, () => {
          return HttpResponse.json({ message: 'Not found' }, { status: 404 });
        })
      );

      await expect(SessionService.getSessionWithAgent(1)).rejects.toThrow();
    });
  });
});
