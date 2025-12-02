import { apiManager } from './api-manager';
import { API_ENDPOINTS } from '../constants/api.constants';
import {
  ChatHistoryResponse,
  SendMessageRequest,
  SendMessageResponse,
  Session,
} from '../types/chat.types';

export class ChatService {
  /**
   * Get all sessions for an agent
   */
  static async getSessions(agentId: number): Promise<Session[]> {
    return apiManager.get<Session[]>(API_ENDPOINTS.CHAT.SESSIONS(agentId));
  }

  /**
   * Create a new session for an agent
   */
  static async createSession(agentId: number): Promise<Session> {
    return apiManager.post<Session>(API_ENDPOINTS.CHAT.SESSIONS(agentId), {});
  }

  /**
   * Get chat history for an agent and optional session
   */
  static async getChatHistory(
    agentId: number,
    sessionId?: number
  ): Promise<ChatHistoryResponse> {
    return apiManager.get<ChatHistoryResponse>(
      API_ENDPOINTS.CHAT.BY_AGENT(agentId, sessionId)
    );
  }

  /**
   * Send a message to an agent in a specific session
   */
  static async sendMessage(
    agentId: number,
    message: string,
    sessionId?: number
  ): Promise<SendMessageResponse> {
    const body: SendMessageRequest = { message };
    return apiManager.post<SendMessageResponse>(
      API_ENDPOINTS.CHAT.BY_AGENT(agentId, sessionId),
      body
    );
  }

  /**
   * Update a session name
   */
  static async updateSession(
    agentId: number,
    sessionId: number,
    sessionName?: string
  ): Promise<Session> {
    return apiManager.put<Session>(
      API_ENDPOINTS.CHAT.SESSION(agentId, sessionId),
      {
        session_name: sessionName,
      }
    );
  }

  /**
   * Delete a session (and all related messages and memory chunks)
   */
  static async deleteSession(
    agentId: number,
    sessionId: number
  ): Promise<void> {
    return apiManager.delete(API_ENDPOINTS.CHAT.SESSION(agentId, sessionId));
  }

  /**
   * Get session with agent ID (for routing)
   * Returns both session and agentId
   */
  static async getSessionWithAgent(
    sessionId: number
  ): Promise<{ session: Session; agentId: number }> {
    return apiManager.get<{ session: Session; agentId: number }>(
      `/api/sessions/${sessionId}`
    );
  }
}
