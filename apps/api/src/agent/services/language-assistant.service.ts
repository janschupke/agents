import { Injectable } from '@nestjs/common';
import { AgentWithConfig } from '../../common/interfaces/agent.interface';
import { AgentType } from '@openai/shared-types';

@Injectable()
export class LanguageAssistantService {
  /**
   * Check if agent is a language assistant
   */
  isLanguageAssistant(
    agent: AgentWithConfig | { agentType?: AgentType | string | null }
  ): boolean {
    return agent.agentType === AgentType.LANGUAGE_ASSISTANT;
  }

  /**
   * Check if agent is a general agent
   */
  isGeneralAgent(
    agent: AgentWithConfig | { agentType?: AgentType | string | null }
  ): boolean {
    const agentType = agent.agentType;
    return !agentType || agentType === AgentType.GENERAL;
  }

  /**
   * Get agent language if set
   */
  getAgentLanguage(
    agent: AgentWithConfig | { language?: string | null }
  ): string | null {
    return agent.language || null;
  }

  /**
   * Check if agent has language configured
   */
  hasLanguage(agent: AgentWithConfig | { language?: string | null }): boolean {
    return !!agent.language;
  }

  /**
   * Validate language code format (ISO 639-1)
   */
  isValidLanguageCode(language: string): boolean {
    // Basic validation: 2-10 characters, alphanumeric with optional hyphens
    return /^[a-z]{2}(-[A-Z]{2,8})?$/.test(language);
  }
}
