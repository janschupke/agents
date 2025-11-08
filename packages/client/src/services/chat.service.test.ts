import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChatService } from './chat.service.js';
import { ChatHistoryResponse, SendMessageResponse } from '../types/chat.types.js';
import { apiManager } from './api-manager.js';

// Mock ApiManager
vi.mock('./api-manager.js', () => ({
  apiManager: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe('ChatService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getChatHistory', () => {
    it('should fetch chat history successfully', async () => {
      const mockResponse: ChatHistoryResponse = {
        bot: {
          id: 1,
          name: 'Test Bot',
          description: 'Test Description',
        },
        session: {
          id: 1,
          session_name: 'Session 1',
        },
        messages: [
          { role: 'user', content: 'Hello' },
          { role: 'assistant', content: 'Hi there!' },
        ],
      };

      vi.mocked(apiManager.get).mockResolvedValueOnce(mockResponse);

      const result = await ChatService.getChatHistory(1);

      expect(result).toEqual(mockResponse);
      expect(apiManager.get).toHaveBeenCalledWith('/api/chat/1');
    });

    it('should throw error when fetch fails', async () => {
      vi.mocked(apiManager.get).mockRejectedValueOnce({
        message: 'Not found',
        status: 404,
      });

      await expect(ChatService.getChatHistory(1)).rejects.toThrow();
    });
  });

  describe('sendMessage', () => {
    it('should send message successfully', async () => {
      const mockResponse: SendMessageResponse = {
        response: 'Test response',
        session: {
          id: 1,
          session_name: 'Session 1',
        },
      };

      vi.mocked(apiManager.post).mockResolvedValueOnce(mockResponse);

      const result = await ChatService.sendMessage(1, 'Test message');

      expect(result).toEqual(mockResponse);
      expect(apiManager.post).toHaveBeenCalledWith('/api/chat/1', {
        message: 'Test message',
      });
    });

    it('should throw error when send fails', async () => {
      vi.mocked(apiManager.post).mockRejectedValueOnce({
        message: 'Internal server error',
        status: 500,
      });

      await expect(ChatService.sendMessage(1, 'Test message')).rejects.toThrow();
    });
  });
});
