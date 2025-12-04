import { Injectable, Logger } from '@nestjs/common';
import { DEFAULT_AGENT_CONFIG } from '../../common/constants/api.constants';
import { ResponseLength } from '../../common/enums/response-length.enum';
import { Gender } from '../../common/enums/gender.enum';
import { Sentiment } from '../../common/enums/sentiment.enum';

/**
 * Service responsible for agent configuration business logic
 * Separates configuration logic from data access
 */
@Injectable()
export class AgentConfigService {
  private readonly logger = new Logger(AgentConfigService.name);

  /**
   * Get default agent configuration
   */
  getDefaultAgentConfig(): Record<string, unknown> {
    return { ...DEFAULT_AGENT_CONFIG };
  }

  /**
   * Merge agent-specific config with defaults
   * Business logic: ensures all required config keys have values
   */
  mergeAgentConfig(
    agentConfig: Record<string, unknown>
  ): Record<string, unknown> {
    const defaults = this.getDefaultAgentConfig();
    const merged = { ...defaults, ...agentConfig };
    this.logger.debug(
      `Merged agent config. Keys: ${Object.keys(merged).join(', ')}`
    );
    return merged;
  }

  /**
   * Generate behavior rules from agent config values
   * Includes: gender, age, personality, sentiment, interests, response length
   */
  generateBehaviorRulesFromConfig(
    configs: Record<string, unknown>
  ): string[] {
    const rules: string[] = [];

    // Response length
    if (configs.response_length) {
      const responseLength = configs.response_length as ResponseLength;
      if (responseLength === ResponseLength.ADAPT) {
        rules.push("Adapt your response length to the user's message and context");
      } else {
        rules.push(`Respond with messages of ${responseLength} length`);
      }
    }

    // Age
    if (configs.age !== undefined && configs.age !== null) {
      const age = configs.age as number;
      if (age < 13) {
        rules.push(`You are ${age} years old. Speak like a child - use simpler language, show curiosity and wonder, and express yourself in an age-appropriate way.`);
      } else if (age < 18) {
        rules.push(`You are ${age} years old. Speak like a teenager - use casual language, show enthusiasm, and express yourself in a way that reflects teenage interests and concerns.`);
      } else if (age < 30) {
        rules.push(`You are ${age} years old. Speak like a young adult - use modern, energetic language and show interest in contemporary topics and experiences.`);
      } else if (age < 50) {
        rules.push(`You are ${age} years old. Speak like a mature adult - use balanced, thoughtful language and show experience and wisdom in your communication.`);
      } else if (age < 70) {
        rules.push(`You are ${age} years old. Speak like a middle-aged adult - use refined language, show life experience, and communicate with wisdom and perspective.`);
      } else {
        rules.push(`You are ${age} years old. Speak like an elder - use thoughtful, wise language, draw from extensive life experience, and communicate with patience and depth.`);
      }
    }

    // Gender
    if (configs.gender) {
      const gender = configs.gender as Gender;
      rules.push(`You are ${gender}`);
    }

    // Personality
    if (configs.personality) {
      const personality = configs.personality as string;
      rules.push(`Your personality is ${personality}`);
    }

    // Sentiment
    if (configs.sentiment) {
      const sentiment = configs.sentiment as Sentiment;
      rules.push(`You feel ${sentiment} toward the user`);
    }

    // Interests
    if (configs.interests && Array.isArray(configs.interests) && configs.interests.length > 0) {
      const interests = configs.interests.filter((i): i is string => typeof i === 'string');
      if (interests.length > 0) {
        const interestsList = interests.join(', ');
        rules.push(`These are your interests: ${interestsList}`);
      }
    }

    return rules;
  }

  /**
   * Merge user-provided behavior rules with auto-generated rules from config
   */
  mergeBehaviorRules(
    userRules: string[] | undefined,
    configs: Record<string, unknown>
  ): string[] | undefined {
    const generatedRules = this.generateBehaviorRulesFromConfig(configs);
    const userRulesArray = userRules || [];

    // If both are empty, return undefined
    if (generatedRules.length === 0 && userRulesArray.length === 0) {
      return undefined;
    }

    // Merge: user rules first, then generated rules
    const merged = [...userRulesArray, ...generatedRules];
    return merged.length > 0 ? merged : undefined;
  }

  /**
   * Validate agent configuration
   */
  validateAgentConfig(_config: Record<string, unknown>): boolean {
    // Add validation logic here if needed
    return true;
  }
}
