import { apiManager } from './api-manager.js';
import { API_ENDPOINTS } from '../constants/api.constants.js';

export interface HealthcheckResponse {
  status: string;
  message: string;
  bots: Array<{
    id: number;
    name: string;
    description: string | null;
  }>;
}

export class HealthcheckService {
  /**
   * Check API health status
   */
  static async check(): Promise<HealthcheckResponse> {
    return apiManager.get<HealthcheckResponse>(API_ENDPOINTS.HEALTHCHECK);
  }
}
