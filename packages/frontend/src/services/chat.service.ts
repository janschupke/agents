import { API_BASE_URL, API_ENDPOINTS } from '../constants/api.constants.js';
import {
  ChatHistoryResponse,
  SendMessageRequest,
  SendMessageResponse,
} from '../types/chat.types.js';

export class ChatService {
  private static async fetchWithErrorHandling<T>(
    url: string,
    options?: RequestInit,
  ): Promise<T> {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: 'Failed to fetch',
      }));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  static async getChatHistory(
    botId: number,
  ): Promise<ChatHistoryResponse> {
    const url = `${API_BASE_URL}${API_ENDPOINTS.CHAT(botId)}`;
    return this.fetchWithErrorHandling<ChatHistoryResponse>(url);
  }

  static async sendMessage(
    botId: number,
    message: string,
  ): Promise<SendMessageResponse> {
    const url = `${API_BASE_URL}${API_ENDPOINTS.CHAT(botId)}`;
    const body: SendMessageRequest = { message };
    return this.fetchWithErrorHandling<SendMessageResponse>(url, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }
}
