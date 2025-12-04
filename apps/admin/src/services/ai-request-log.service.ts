import { apiManager } from './api-manager.js';
import { API_ENDPOINTS } from '../constants/api.constants.js';
import type {
  AiRequestLogsResponse,
  GetAiRequestLogsParams,
} from '../types/ai-request-log.types.js';

export class AiRequestLogService {
  static async getLogs(
    params?: GetAiRequestLogsParams
  ): Promise<AiRequestLogsResponse> {
    const queryParams = new URLSearchParams();

    if (params?.userId) queryParams.append('userId', params.userId);
    if (params?.model) queryParams.append('model', params.model);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.pageSize)
      queryParams.append('pageSize', params.pageSize.toString());
    if (params?.orderBy) queryParams.append('orderBy', params.orderBy);
    if (params?.orderDirection)
      queryParams.append('orderDirection', params.orderDirection);

    const url = `${API_ENDPOINTS.AI_REQUEST_LOGS}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiManager.get<AiRequestLogsResponse>(url);
  }
}
