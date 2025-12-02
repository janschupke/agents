import { apiManager } from './api-manager.js';
import { API_ENDPOINTS } from '../constants/api.constants.js';
import { Bot, CreateBotRequest, UpdateBotRequest } from '../types/chat.types.js';

export class BotService {
  /**
   * Get all bots
   */
  static async getAllBots(): Promise<Bot[]> {
    return apiManager.get<Bot[]>(API_ENDPOINTS.BOTS.BASE);
  }

  /**
   * Get a bot by ID
   */
  static async getBot(botId: number): Promise<Bot> {
    return apiManager.get<Bot>(API_ENDPOINTS.BOTS.BY_ID(botId));
  }

  /**
   * Create a new bot
   */
  static async createBot(data: CreateBotRequest): Promise<Bot> {
    return apiManager.post<Bot>(API_ENDPOINTS.BOTS.BASE, data);
  }

  /**
   * Update a bot
   */
  static async updateBot(botId: number, data: UpdateBotRequest): Promise<Bot> {
    return apiManager.put<Bot>(API_ENDPOINTS.BOTS.BY_ID(botId), data);
  }

  /**
   * Delete a bot (and all related data: sessions, messages, configs, memories)
   */
  static async deleteBot(botId: number): Promise<void> {
    return apiManager.delete(API_ENDPOINTS.BOTS.BY_ID(botId));
  }
}
