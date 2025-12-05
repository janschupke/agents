import { Injectable, Logger } from '@nestjs/common';
import { DEFAULT_AGENT_CONFIG } from '../../common/constants/api.constants';
import { OPENAI_PROMPTS } from '../../common/constants/openai-prompts.constants';
import {
  ResponseLength,
  Gender,
  Sentiment,
  NUMERIC_CONSTANTS,
} from '@openai/shared-types';
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
  generateBehaviorRulesFromConfig(configs: Record<string, unknown>): string[] {
    const rules: string[] = [];

    // Response length - validate against enum
    if (
      configs.response_length !== undefined &&
      configs.response_length !== null
    ) {
      const responseLength = configs.response_length as string;
      const validValues = Object.values(ResponseLength);
      if (validValues.includes(responseLength as ResponseLength)) {
        const validatedLength = responseLength as ResponseLength;
        if (validatedLength === ResponseLength.ADAPT) {
          rules.push(OPENAI_PROMPTS.CONFIG_BASED_RULES.RESPONSE_LENGTH.ADAPT);
        } else {
          rules.push(
            OPENAI_PROMPTS.CONFIG_BASED_RULES.RESPONSE_LENGTH.FIXED(
              validatedLength
            )
          );
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
      if (
        !isNaN(age) &&
        age >= NUMERIC_CONSTANTS.AGE_MIN &&
        age <= NUMERIC_CONSTANTS.AGE_MAX
      ) {
        if (age < 13) {
          rules.push(OPENAI_PROMPTS.CONFIG_BASED_RULES.AGE.CHILD(age));
        } else if (age < 18) {
          rules.push(OPENAI_PROMPTS.CONFIG_BASED_RULES.AGE.TEENAGER(age));
        } else if (age < NUMERIC_CONSTANTS.AGE_YOUNG_THRESHOLD) {
          rules.push(OPENAI_PROMPTS.CONFIG_BASED_RULES.AGE.YOUNG_ADULT(age));
        } else if (age < 50) {
          rules.push(OPENAI_PROMPTS.CONFIG_BASED_RULES.AGE.MATURE_ADULT(age));
        } else if (age < 70) {
          rules.push(OPENAI_PROMPTS.CONFIG_BASED_RULES.AGE.MIDDLE_AGED(age));
        } else {
          rules.push(OPENAI_PROMPTS.CONFIG_BASED_RULES.AGE.ELDER(age));
        }
      } else {
        this.logger.warn(
          `Invalid age value: ${configs.age}. Must be a number between ${NUMERIC_CONSTANTS.AGE_MIN} and ${NUMERIC_CONSTANTS.AGE_MAX}`
        );
      }
    }

    // Gender - validate against enum
    if (configs.gender !== undefined && configs.gender !== null) {
      const gender = configs.gender as string;
      const validValues = Object.values(Gender);
      if (validValues.includes(gender as Gender)) {
        const validatedGender = gender as Gender;
        rules.push(OPENAI_PROMPTS.CONFIG_BASED_RULES.GENDER(validatedGender));
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
        rules.push(OPENAI_PROMPTS.CONFIG_BASED_RULES.PERSONALITY(personality));
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
        rules.push(
          OPENAI_PROMPTS.CONFIG_BASED_RULES.SENTIMENT(validatedSentiment)
        );
      } else {
        this.logger.warn(
          `Invalid sentiment value: ${sentiment}. Valid values: ${validValues.join(', ')}`
        );
      }
    }

    // Interests - validate array of strings
    if (
      configs.interests &&
      Array.isArray(configs.interests) &&
      configs.interests.length > 0
    ) {
      const interests = configs.interests.filter(
        (i): i is string => typeof i === 'string'
      );
      if (interests.length > 0) {
        const interestsList = interests.join(', ');
        rules.push(OPENAI_PROMPTS.CONFIG_BASED_RULES.INTERESTS(interestsList));
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
