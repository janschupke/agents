import { Injectable, Logger } from '@nestjs/common';
import { SystemConfigRepository } from './system-config.repository';
import { UpdateSystemConfigDto } from '../common/dto/system-config.dto';
import { SystemConfig } from '../common/types/config.types';
import { AgentType } from '@prisma/client';

@Injectable()
export class SystemConfigService {
  private readonly logger = new Logger(SystemConfigService.name);

  constructor(
    private readonly systemConfigRepository: SystemConfigRepository
  ) {}

  async getBehaviorRules(): Promise<string[]> {
    this.logger.debug('Getting system behavior rules');
    const config =
      await this.systemConfigRepository.findByKey('behavior_rules');
    if (!config) {
      this.logger.debug('No behavior rules configured');
      return [];
    }

    const rules = this.parseBehaviorRules(config.configValue);
    this.logger.debug(`Found ${rules.length} behavior rules`);
    return rules;
  }

  async getSystemPrompt(): Promise<string | null> {
    this.logger.debug('Getting system prompt');
    const config = await this.systemConfigRepository.findByKey('system_prompt');
    if (!config) {
      this.logger.debug('No system prompt configured');
      return null;
    }

    const prompt =
      typeof config.configValue === 'string'
        ? config.configValue
        : String(config.configValue || '');
    this.logger.debug('Found system prompt');
    return prompt || null;
  }

  /**
   * Get system prompt by agent type
   * Falls back to main prompt (agentType = null) if type-specific not found
   */
  async getSystemPromptByAgentType(
    agentType: AgentType | null
  ): Promise<string | null> {
    this.logger.debug(
      `Getting system prompt for agent type: ${agentType || 'main'}`
    );
    return this.systemConfigRepository.getSystemPromptByAgentType(agentType);
  }

  /**
   * Get system behavior rules by agent type
   * Falls back to main rules (agentType = null) if type-specific not found
   */
  async getBehaviorRulesByAgentType(
    agentType: AgentType | null
  ): Promise<string[]> {
    this.logger.debug(
      `Getting behavior rules for agent type: ${agentType || 'main'}`
    );
    return this.systemConfigRepository.getBehaviorRulesByAgentType(agentType);
  }

  /**
   * Update system prompt for specific agent type (or main if agentType is null)
   */
  async updateSystemPromptByAgentType(
    agentType: AgentType | null,
    prompt: string
  ): Promise<void> {
    this.logger.log(
      `Updating system prompt for agent type: ${agentType || 'main'}`
    );
    if (prompt === null || prompt.trim() === '') {
      // Delete the config if prompt is empty
      try {
        const existing =
          await this.systemConfigRepository.findByKeyAndAgentType(
            'system_prompt',
            agentType
          );
        if (existing) {
          await this.systemConfigRepository.delete(existing.configKey);
        }
        this.logger.log('System prompt deleted');
      } catch (error) {
        this.logger.debug('System prompt config not found for deletion');
      }
    } else {
      await this.systemConfigRepository.upsert(
        'system_prompt',
        prompt,
        agentType
      );
      this.logger.log('System prompt updated successfully');
    }
  }

  /**
   * Update system behavior rules for specific agent type (or main if agentType is null)
   */
  async updateBehaviorRulesByAgentType(
    agentType: AgentType | null,
    rules: string[]
  ): Promise<void> {
    this.logger.log(
      `Updating behavior rules for agent type: ${agentType || 'main'} (${rules.length} rules)`
    );
    await this.systemConfigRepository.upsert(
      'behavior_rules',
      rules,
      agentType
    );
    this.logger.log('System behavior rules updated successfully');
  }

  async getAllConfigs(): Promise<SystemConfig> {
    this.logger.debug('Getting all system configs');
    return this.systemConfigRepository.findAllAsRecord();
  }

  async updateBehaviorRules(rules: string[]): Promise<void> {
    this.logger.log(`Updating system behavior rules (${rules.length} rules)`);
    await this.systemConfigRepository.upsert('behavior_rules', rules);
    this.logger.log('System behavior rules updated successfully');
  }

  async updateSystemPrompt(systemPrompt: string | null): Promise<void> {
    this.logger.log('Updating system prompt');
    if (systemPrompt === null || systemPrompt.trim() === '') {
      // Delete the config if prompt is empty
      try {
        await this.systemConfigRepository.delete('system_prompt');
        this.logger.log('System prompt deleted');
      } catch (error) {
        // Ignore if it doesn't exist
        this.logger.debug('System prompt config not found for deletion');
      }
    } else {
      await this.systemConfigRepository.upsert('system_prompt', systemPrompt);
      this.logger.log('System prompt updated successfully');
    }
  }

  async updateConfigs(configs: UpdateSystemConfigDto): Promise<void> {
    this.logger.log('Updating system configs');
    await this.systemConfigRepository.updateConfigs(configs as SystemConfig);
    this.logger.log('System configs updated successfully');
  }

  private parseBehaviorRules(behaviorRules: unknown): string[] {
    if (!behaviorRules) return [];

    try {
      if (typeof behaviorRules === 'string') {
        try {
          const parsed = JSON.parse(behaviorRules);
          if (Array.isArray(parsed)) {
            return parsed.map((r) => String(r));
          } else if (
            typeof parsed === 'object' &&
            parsed !== null &&
            'rules' in parsed &&
            Array.isArray((parsed as { rules: unknown }).rules)
          ) {
            return (parsed as { rules: unknown[] }).rules.map((r: unknown) =>
              String(r)
            );
          } else {
            return [String(parsed)];
          }
        } catch {
          return [behaviorRules];
        }
      } else if (Array.isArray(behaviorRules)) {
        return behaviorRules.map((r: unknown) => String(r));
      } else if (
        typeof behaviorRules === 'object' &&
        behaviorRules !== null &&
        'rules' in behaviorRules &&
        Array.isArray((behaviorRules as { rules: unknown }).rules)
      ) {
        const rulesObj = behaviorRules as { rules: unknown[] };
        return rulesObj.rules.map((r: unknown) => String(r));
      } else {
        return [String(behaviorRules)];
      }
    } catch (error) {
      this.logger.error('Error parsing behavior rules:', error);
      return [];
    }
  }
}
