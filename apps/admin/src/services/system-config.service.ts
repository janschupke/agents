import { apiManager } from './api-manager.js';
import { API_ENDPOINTS } from '../constants/api.constants.js';

interface SystemBehaviorRules {
  rules: string[];
}

class SystemConfigService {
  async getBehaviorRules(): Promise<SystemBehaviorRules> {
    return apiManager.get<SystemBehaviorRules>(
      API_ENDPOINTS.SYSTEM_CONFIG_BEHAVIOR_RULES
    );
  }

  async updateBehaviorRules(rules: string[]): Promise<SystemBehaviorRules> {
    return apiManager.put<SystemBehaviorRules>(
      API_ENDPOINTS.SYSTEM_CONFIG_BEHAVIOR_RULES,
      { rules }
    );
  }
}

export const systemConfigService = new SystemConfigService();
