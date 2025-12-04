import { apiManager } from './api-manager.js';
import { API_ENDPOINTS } from '../constants/api.constants.js';

interface SystemBehaviorRules {
  rules: string[];
  system_prompt?: string;
}

class SystemConfigService {
  async getBehaviorRules(): Promise<SystemBehaviorRules> {
    return apiManager.get<SystemBehaviorRules>(
      API_ENDPOINTS.SYSTEM_CONFIG_BEHAVIOR_RULES
    );
  }

  async updateBehaviorRules(
    rules: string[],
    systemPrompt?: string
  ): Promise<SystemBehaviorRules> {
    return apiManager.put<SystemBehaviorRules>(
      API_ENDPOINTS.SYSTEM_CONFIG_BEHAVIOR_RULES,
      { rules, system_prompt: systemPrompt }
    );
  }
}

export const systemConfigService = new SystemConfigService();
