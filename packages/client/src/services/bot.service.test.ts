import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../test/mocks/server';
import { BotService } from './bot.service';
import { Bot, CreateBotRequest, UpdateBotRequest } from '../types/chat.types';
import { API_BASE_URL } from '../constants/api.constants';

describe('BotService', () => {

  describe('getAllBots', () => {
    it('should fetch all bots successfully', async () => {
      const result = await BotService.getAllBots();

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        id: 1,
        name: 'Test Bot 1',
        description: 'Test Description 1',
      });
    });

    it('should throw error when fetch fails', async () => {
      server.use(
        http.get(`${API_BASE_URL}/api/bots`, () => {
          return HttpResponse.json({ message: 'Internal server error' }, { status: 500 });
        })
      );

      await expect(BotService.getAllBots()).rejects.toThrow();
    });
  });

  describe('getBot', () => {
    it('should fetch a bot by ID successfully', async () => {
      const result = await BotService.getBot(1);

      expect(result).toMatchObject({
        id: 1,
        name: 'Test Bot 1',
        description: 'Test Description 1',
      });
    });

    it('should throw error when bot not found', async () => {
      server.use(
        http.get(`${API_BASE_URL}/api/bots/999`, () => {
          return HttpResponse.json({ message: 'Bot not found' }, { status: 404 });
        })
      );

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

      const result = await BotService.createBot(createData);

      expect(result).toMatchObject({
        name: 'New Bot',
        description: 'New Description',
      });
      expect(result.id).toBeGreaterThan(0);
    });

    it('should throw error when creation fails', async () => {
      const createData: CreateBotRequest = {
        name: 'New Bot',
      };

      server.use(
        http.post(`${API_BASE_URL}/api/bots`, () => {
          return HttpResponse.json({ message: 'Validation error' }, { status: 400 });
        })
      );

      await expect(BotService.createBot(createData)).rejects.toThrow();
    });
  });

  describe('updateBot', () => {
    it('should update a bot successfully', async () => {
      const updateData: UpdateBotRequest = {
        name: 'Updated Bot',
        description: 'Updated Description',
      };

      const result = await BotService.updateBot(1, updateData);

      expect(result).toMatchObject({
        id: 1,
        name: 'Updated Bot',
        description: 'Updated Description',
      });
    });

    it('should throw error when update fails', async () => {
      const updateData: UpdateBotRequest = {
        name: 'Updated Bot',
      };

      server.use(
        http.put(`${API_BASE_URL}/api/bots/999`, () => {
          return HttpResponse.json({ message: 'Bot not found' }, { status: 404 });
        })
      );

      await expect(BotService.updateBot(999, updateData)).rejects.toThrow();
    });
  });

});
