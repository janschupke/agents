import { Injectable } from '@nestjs/common';
import { AgentWithConfig } from '../../common/interfaces/agent.interface';
import { LanguageAssistantService } from '../../agent/services/language-assistant.service';

export interface ConfigurationRule {
  content: string;
  order: number; // Lower numbers come first
}

@Injectable()
export class ConfigurationRulesService {

  constructor(
    private readonly languageAssistantService: LanguageAssistantService
  ) {}

  /**
   * Generate configuration rules for an agent
   * These rules come after admin-defined system rules but before user-defined behavior rules
   * 
   * Order:
   * 1. Admin-defined system rules (handled in MessagePreparationService)
   * 2. Configuration rules (datetime, language) - THIS SERVICE
   * 3. User-defined behavior rules (handled in MessagePreparationService)
   */
  generateConfigurationRules(
    agent: AgentWithConfig,
    currentDateTime: Date = new Date()
  ): ConfigurationRule[] {
    const rules: ConfigurationRule[] = [];

    // Rule 1: Current datetime (always added)
    const datetimeRule = this.generateDatetimeRule(currentDateTime);
    rules.push({
      content: datetimeRule,
      order: 1,
    });

    // Rule 2: Language rule (if language is set)
    const language = this.languageAssistantService.getAgentLanguage(agent);
    if (language) {
      const languageRule = this.generateLanguageRule(language);
      rules.push({
        content: languageRule,
        order: 2,
      });
    }

    // Sort by order to ensure correct sequence
    return rules.sort((a, b) => a.order - b.order);
  }

  /**
   * Generate datetime rule
   */
  private generateDatetimeRule(currentDateTime: Date): string {
    // Format: "Currently it's {ISO 8601 datetime}"
    const isoString = currentDateTime.toISOString();
    return `Currently it's ${isoString}`;
  }

  /**
   * Generate language rule
   */
  private generateLanguageRule(language: string): string {
    // Format: "Always respond in {language}"
    // Language name could be enhanced with a language name mapping service
    return `Always respond in ${language}`;
  }

  /**
   * Format configuration rules as a single system message
   */
  formatConfigurationRules(rules: ConfigurationRule[]): string {
    if (rules.length === 0) {
      return '';
    }

    const formattedRules = rules.map((rule) => rule.content).join('\n');
    return formattedRules;
  }
}
