import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChatService } from './chat.service';
import { ChatHistoryResponse, SendMessageResponse } from '../types/chat.types';

// Mock fetch globally
global.fetch = vi.fn();

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

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await ChatService.getChatHistory(1);

      expect(result).toEqual(mockResponse);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/chat/1'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        }),
      );
    });

    it('should throw error when fetch fails', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ message: 'Not found' }),
      } as Response);

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

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await ChatService.sendMessage(1, 'Test message');

      expect(result).toEqual(mockResponse);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/chat/1'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ message: 'Test message' }),
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        }),
      );
    });

    it('should throw error when send fails', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ message: 'Internal server error' }),
      } as Response);

      await expect(ChatService.sendMessage(1, 'Test message')).rejects.toThrow();
    });
  });
});
