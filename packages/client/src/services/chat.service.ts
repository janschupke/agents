import { apiManager } from './api-manager.js';
import { API_ENDPOINTS } from '../constants/api.constants.js';
import {
  ChatHistoryResponse,
  SendMessageRequest,
  SendMessageResponse,
  Session,
} from '../types/chat.types.js';

export class ChatService {
  /**
   * Get all sessions for a bot
   */
  static async getSessions(botId: number): Promise<Session[]> {
    return apiManager.get<Session[]>(API_ENDPOINTS.SESSIONS(botId));
  }

  /**
   * Create a new session for a bot
   */
  static async createSession(botId: number): Promise<Session> {
    return apiManager.post<Session>(API_ENDPOINTS.SESSIONS(botId), {});
  }

  /**
   * Get chat history for a bot and optional session
   */
  static async getChatHistory(botId: number, sessionId?: number): Promise<ChatHistoryResponse> {
    return apiManager.get<ChatHistoryResponse>(API_ENDPOINTS.CHAT(botId, sessionId));
  }

  /**
   * Send a message to a bot in a specific session
   */
  static async sendMessage(
    botId: number,
    message: string,
    sessionId?: number
  ): Promise<SendMessageResponse> {
    const body: SendMessageRequest = { message };
    return apiManager.post<SendMessageResponse>(API_ENDPOINTS.CHAT(botId, sessionId), body);
  }

  /**
   * Update a session name
   */
  static async updateSession(
    botId: number,
    sessionId: number,
    sessionName?: string
  ): Promise<Session> {
    return apiManager.put<Session>(API_ENDPOINTS.SESSION(botId, sessionId), {
      session_name: sessionName,
    });
  }

  /**
   * Delete a session (and all related messages and memory chunks)
   */
  static async deleteSession(botId: number, sessionId: number): Promise<void> {
    return apiManager.delete(API_ENDPOINTS.SESSION(botId, sessionId));
  }
}
