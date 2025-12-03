import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../../test/mocks/server';
import { MessageService } from './message.service';
import { API_BASE_URL } from '../../../constants/api.constants';

describe('MessageService', () => {
  describe('getChatHistory', () => {
    it('should fetch chat history successfully', async () => {
      const result = await MessageService.getChatHistory(1);

      expect(result).toMatchObject({
        agent: {
          id: 1,
          name: 'Test Agent 1',
        },
        session: {
          id: 1,
          session_name: 'Session 1',
        },
      });
      expect(result.messages).toBeDefined();
    });

    it('should throw error when fetch fails', async () => {
      server.use(
        http.get(`${API_BASE_URL}/api/chat/1`, () => {
          return HttpResponse.json({ message: 'Not found' }, { status: 404 });
        })
      );

      await expect(MessageService.getChatHistory(1)).rejects.toThrow();
    });
  });

  describe('sendMessage', () => {
    it('should send message successfully', async () => {
      const result = await MessageService.sendMessage(1, 'Test message');

      expect(result).toMatchObject({
        response: 'Hello! How can I help you?',
        session: {
          id: 1,
          session_name: 'Session 1',
        },
      });
    });

    it('should throw error when send fails', async () => {
      server.use(
        http.post(`${API_BASE_URL}/api/chat/1`, () => {
          return HttpResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
          );
        })
      );

      await expect(
        MessageService.sendMessage(1, 'Test message')
      ).rejects.toThrow();
    });
  });
});
