import { apiManager } from './api-manager.js';
import { API_ENDPOINTS } from '../constants/api.constants.js';
import {
  ChatHistoryResponse,
  SendMessageRequest,
  SendMessageResponse,
} from '../types/chat.types.js';

export class ChatService {
  /**
   * Get chat history for a bot
   */
  static async getChatHistory(
    botId: number,
  ): Promise<ChatHistoryResponse> {
    return apiManager.get<ChatHistoryResponse>(
      API_ENDPOINTS.CHAT(botId),
    );
  }

  /**
   * Send a message to a bot
   */
  static async sendMessage(
    botId: number,
    message: string,
  ): Promise<SendMessageResponse> {
    const body: SendMessageRequest = { message };
    return apiManager.post<SendMessageResponse>(
      API_ENDPOINTS.CHAT(botId),
      body,
    );
  }
}
