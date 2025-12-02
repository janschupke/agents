import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BotService } from './bot.service';
import { Bot, CreateBotRequest, UpdateBotRequest } from '../types/chat.types';
import { apiManager } from './api-manager';

// Mock ApiManager
vi.mock('./api-manager', () => ({
  apiManager: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('BotService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAllBots', () => {
    it('should fetch all bots successfully', async () => {
      const mockBots: Bot[] = [
        {
          id: 1,
          name: 'Test Bot 1',
          description: 'Description 1',
          avatarUrl: null,
          createdAt: '2024-01-01',
        },
        {
          id: 2,
          name: 'Test Bot 2',
          description: 'Description 2',
          avatarUrl: null,
          createdAt: '2024-01-02',
        },
      ];

      vi.mocked(apiManager.get).mockResolvedValueOnce(mockBots);

      const result = await BotService.getAllBots();

      expect(result).toEqual(mockBots);
      expect(apiManager.get).toHaveBeenCalledWith('/api/bots');
    });

    it('should throw error when fetch fails', async () => {
      vi.mocked(apiManager.get).mockRejectedValueOnce({
        message: 'Internal server error',
        status: 500,
      });

      await expect(BotService.getAllBots()).rejects.toThrow();
    });
  });

  describe('getBot', () => {
    it('should fetch a bot by ID successfully', async () => {
      const mockBot: Bot = {
        id: 1,
        name: 'Test Bot',
        description: 'Test Description',
        avatarUrl: null,
        createdAt: '2024-01-01',
      };

      vi.mocked(apiManager.get).mockResolvedValueOnce(mockBot);

      const result = await BotService.getBot(1);

      expect(result).toEqual(mockBot);
      expect(apiManager.get).toHaveBeenCalledWith('/api/bots/1');
    });

    it('should throw error when bot not found', async () => {
      vi.mocked(apiManager.get).mockRejectedValueOnce({
        message: 'Not found',
        status: 404,
      });

      await expect(BotService.getBot(999)).rejects.toThrow();
    });
  });

  describe('createBot', () => {
    it('should create a new bot successfully', async () => {
      const createData: CreateBotRequest = {
        name: 'New Bot',
        description: 'New Description',
        configs: {
          temperature: 0.7,
          system_prompt: 'You are a helpful assistant',
          behavior_rules: ['Be polite', 'Be concise'],
        },
      };

      const mockBot: Bot = {
        id: 1,
        name: 'New Bot',
        description: 'New Description',
        avatarUrl: null,
        createdAt: '2024-01-01',
      };

      vi.mocked(apiManager.post).mockResolvedValueOnce(mockBot);

      const result = await BotService.createBot(createData);

      expect(result).toEqual(mockBot);
      expect(apiManager.post).toHaveBeenCalledWith('/api/bots', createData);
    });

    it('should throw error when creation fails', async () => {
      const createData: CreateBotRequest = {
        name: 'New Bot',
      };

      vi.mocked(apiManager.post).mockRejectedValueOnce({
        message: 'Validation error',
        status: 400,
      });

      await expect(BotService.createBot(createData)).rejects.toThrow();
    });
  });

  describe('updateBot', () => {
    it('should update a bot successfully', async () => {
      const updateData: UpdateBotRequest = {
        name: 'Updated Bot',
        description: 'Updated Description',
      };

      const mockBot: Bot = {
        id: 1,
        name: 'Updated Bot',
        description: 'Updated Description',
        avatarUrl: null,
        createdAt: '2024-01-01',
      };

      vi.mocked(apiManager.put).mockResolvedValueOnce(mockBot);

      const result = await BotService.updateBot(1, updateData);

      expect(result).toEqual(mockBot);
      expect(apiManager.put).toHaveBeenCalledWith('/api/bots/1', updateData);
    });

    it('should throw error when update fails', async () => {
      const updateData: UpdateBotRequest = {
        name: 'Updated Bot',
      };

      vi.mocked(apiManager.put).mockRejectedValueOnce({
        message: 'Not found',
        status: 404,
      });

      await expect(BotService.updateBot(999, updateData)).rejects.toThrow();
    });
  });

});
