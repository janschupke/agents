import { Injectable, Logger } from '@nestjs/common';
import { DEFAULT_AGENT_CONFIG } from '../../common/constants/api.constants';
import { ResponseLength } from '../../common/enums/response-length.enum';
import { Gender } from '../../common/enums/gender.enum';
import { Sentiment } from '../../common/enums/sentiment.enum';
import { PERSONALITY_TYPES, PersonalityType } from '@openai/shared-types';

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
   * Generate behavior rules from agent config values with validation
   * Includes: gender, age, personality, sentiment, interests, response length
   * These rules use preset prompts and only accept legal enum values
   * 
   * @param configs - Configuration object with validated enum values
   * @returns Array of rule strings (preset prompts)
   */
  generateBehaviorRulesFromConfig(
    configs: Record<string, unknown>
  ): string[] {
    const rules: string[] = [];

    // Response length - validate against enum
    if (configs.response_length !== undefined && configs.response_length !== null) {
      const responseLength = configs.response_length as string;
      const validValues = Object.values(ResponseLength);
      if (validValues.includes(responseLength as ResponseLength)) {
        const validatedLength = responseLength as ResponseLength;
        if (validatedLength === ResponseLength.ADAPT) {
          rules.push("Adapt your response length to the user's message and context");
        } else {
          rules.push(`Respond with messages of ${validatedLength} length`);
        }
      } else {
        this.logger.warn(
          `Invalid response_length value: ${responseLength}. Valid values: ${validValues.join(', ')}`
        );
      }
    }

    // Age - validate range (0-100)
    if (configs.age !== undefined && configs.age !== null) {
      const age = Number(configs.age);
      if (!isNaN(age) && age >= 0 && age <= 100) {
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
      } else {
        this.logger.warn(`Invalid age value: ${configs.age}. Must be a number between 0 and 100`);
      }
    }

    // Gender - validate against enum
    if (configs.gender !== undefined && configs.gender !== null) {
      const gender = configs.gender as string;
      const validValues = Object.values(Gender);
      if (validValues.includes(gender as Gender)) {
        const validatedGender = gender as Gender;
        rules.push(`You are ${validatedGender}`);
      } else {
        this.logger.warn(
          `Invalid gender value: ${gender}. Valid values: ${validValues.join(', ')}`
        );
      }
    }

    // Personality - validate against PERSONALITY_TYPES
    if (configs.personality !== undefined && configs.personality !== null) {
      const personality = configs.personality as string;
      if (PERSONALITY_TYPES.includes(personality as PersonalityType)) {
        rules.push(`Your personality is ${personality}`);
      } else {
        this.logger.warn(
          `Invalid personality value: ${personality}. Valid values: ${PERSONALITY_TYPES.join(', ')}`
        );
      }
    }

    // Sentiment - validate against enum
    if (configs.sentiment !== undefined && configs.sentiment !== null) {
      const sentiment = configs.sentiment as string;
      const validValues = Object.values(Sentiment);
      if (validValues.includes(sentiment as Sentiment)) {
        const validatedSentiment = sentiment as Sentiment;
        rules.push(`You feel ${validatedSentiment} toward the user`);
      } else {
        this.logger.warn(
          `Invalid sentiment value: ${sentiment}. Valid values: ${validValues.join(', ')}`
        );
      }
    }

    // Interests - validate array of strings
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
