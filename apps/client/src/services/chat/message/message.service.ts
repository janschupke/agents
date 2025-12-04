import { apiManager } from '../../api/api-manager';
import { API_ENDPOINTS } from '../../../constants/api.constants';
import {
  ChatHistoryResponse,
  SendMessageRequest,
  SendMessageResponse,
} from '../../../types/chat.types';

export class MessageService {
  /**
   * Get chat history for an agent and optional session with pagination
   */
  static async getChatHistory(
    agentId: number,
    sessionId?: number,
    limit: number = 20,
    cursor?: number
  ): Promise<ChatHistoryResponse> {
    return apiManager.get<ChatHistoryResponse>(
      API_ENDPOINTS.CHAT.BY_AGENT(agentId, sessionId, limit, cursor)
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
}
