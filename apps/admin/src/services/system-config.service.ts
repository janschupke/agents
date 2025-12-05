import { apiManager } from './api-manager.js';
import { API_ENDPOINTS } from '../constants/api.constants.js';
import { AgentType } from '../types/agent.types';

interface SystemBehaviorRules {
  rules: string[];
  system_prompt?: string;
}

class SystemConfigService {
  async getBehaviorRules(
    agentType: AgentType | null = null
  ): Promise<SystemBehaviorRules> {
    if (agentType === null) {
      return apiManager.get<SystemBehaviorRules>(
        API_ENDPOINTS.SYSTEM_CONFIG_BEHAVIOR_RULES
      );
    }
    return apiManager.get<SystemBehaviorRules>(
      `${API_ENDPOINTS.SYSTEM_CONFIG_BEHAVIOR_RULES}/${agentType}`
    );
  }

  async updateBehaviorRules(
    rules: string[],
    systemPrompt?: string,
    agentType: AgentType | null = null
  ): Promise<SystemBehaviorRules> {
    if (agentType === null) {
      return apiManager.put<SystemBehaviorRules>(
        API_ENDPOINTS.SYSTEM_CONFIG_BEHAVIOR_RULES,
        { rules, system_prompt: systemPrompt }
      );
    }
    return apiManager.put<SystemBehaviorRules>(
      `${API_ENDPOINTS.SYSTEM_CONFIG_BEHAVIOR_RULES}/${agentType}`,
      { rules, system_prompt: systemPrompt }
    );
  }

  async getSystemPrompt(
    agentType: AgentType | null = null
  ): Promise<{ system_prompt?: string }> {
    if (agentType === null) {
      return apiManager.get<{ system_prompt?: string }>(
        API_ENDPOINTS.SYSTEM_CONFIG_SYSTEM_PROMPT
      );
    }
    return apiManager.get<{ system_prompt?: string }>(
      `${API_ENDPOINTS.SYSTEM_CONFIG_SYSTEM_PROMPT}/${agentType}`
    );
  }

  async updateSystemPrompt(
    systemPrompt: string,
    agentType: AgentType | null = null
  ): Promise<{ system_prompt?: string }> {
    if (agentType === null) {
      return apiManager.put<{ system_prompt?: string }>(
        API_ENDPOINTS.SYSTEM_CONFIG_SYSTEM_PROMPT,
        { system_prompt: systemPrompt }
      );
    }
    return apiManager.put<{ system_prompt?: string }>(
      `${API_ENDPOINTS.SYSTEM_CONFIG_SYSTEM_PROMPT}/${agentType}`,
      { system_prompt: systemPrompt }
    );
  }
}

export const systemConfigService = new SystemConfigService();
