import { apiManager } from './api-manager.js';
import { API_ENDPOINTS } from '../constants/api.constants.js';
import { Bot, Embedding, CreateBotRequest, UpdateBotRequest } from '../types/chat.types.js';

export class BotService {
  /**
   * Get all bots
   */
  static async getAllBots(): Promise<Bot[]> {
    return apiManager.get<Bot[]>(API_ENDPOINTS.BOTS);
  }

  /**
   * Get a bot by ID
   */
  static async getBot(botId: number): Promise<Bot> {
    return apiManager.get<Bot>(API_ENDPOINTS.BOT(botId));
  }

  /**
   * Create a new bot
   */
  static async createBot(data: CreateBotRequest): Promise<Bot> {
    return apiManager.post<Bot>(API_ENDPOINTS.BOTS, data);
  }

  /**
   * Update a bot
   */
  static async updateBot(botId: number, data: UpdateBotRequest): Promise<Bot> {
    return apiManager.put<Bot>(API_ENDPOINTS.BOT(botId), data);
  }

  /**
   * Get all embeddings for a bot
   */
  static async getEmbeddings(botId: number): Promise<Embedding[]> {
    return apiManager.get<Embedding[]>(API_ENDPOINTS.BOT_EMBEDDINGS(botId));
  }

  /**
   * Delete an embedding
   */
  static async deleteEmbedding(botId: number, embeddingId: number): Promise<void> {
    return apiManager.delete(API_ENDPOINTS.BOT_EMBEDDING(botId, embeddingId));
  }
}
