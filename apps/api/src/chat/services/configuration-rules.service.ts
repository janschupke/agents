import { Injectable } from '@nestjs/common';
import { AgentWithConfig } from '../../common/interfaces/agent.interface';
import { OPENAI_PROMPTS } from '../../common/constants/openai-prompts.constants';
import { ResponseLength, Gender, Sentiment } from '@openai/shared-types';

interface ConfigurationRule {
  content: string;
  order: number; // Lower numbers come first
}

@Injectable()
export class ConfigurationRulesService {
  constructor() {}

  /**
   * Generate configuration rules for an agent
   * NOTE: This service is deprecated. Datetime and language rules have been moved:
   * - Datetime: Now embedded in system prompt via PromptTransformationService
   * - Language: Now in client agent config rules via MessagePreparationService
   *
   * This service now only handles config-based rules (response_length, age, etc.)
   * which will eventually be moved to AgentConfigService.generateBehaviorRulesFromConfig()
   *
   * @deprecated Use AgentConfigService.generateBehaviorRulesFromConfig() instead
   */
  generateConfigurationRules(agent: AgentWithConfig): ConfigurationRule[] {
    const rules: ConfigurationRule[] = [];

    // NOTE: Datetime and language rules removed - handled elsewhere now

    // Rule 1: Response length (if set)
    const responseLength = this.getResponseLength(agent);
    if (responseLength) {
      const responseLengthRule =
        this.generateResponseLengthRule(responseLength);
      rules.push({
        content: responseLengthRule,
        order: 3,
      });
    }

    // Rule 4: Age (if set)
    const age = this.getAge(agent);
    if (age !== undefined) {
      const ageRule = this.generateAgeRule(age);
      rules.push({
        content: ageRule,
        order: 4,
      });
    }

    // Rule 5: Gender (if set)
    const gender = this.getGender(agent);
    if (gender) {
      const genderRule = this.generateGenderRule(gender);
      rules.push({
        content: genderRule,
        order: 5,
      });
    }

    // Rule 6: Personality (if set)
    const personality = this.getPersonality(agent);
    if (personality) {
      const personalityRule = this.generatePersonalityRule(personality);
      rules.push({
        content: personalityRule,
        order: 6,
      });
    }

    // Rule 7: Interests (if set)
    const interests = this.getInterests(agent);
    if (interests && interests.length > 0) {
      const interestsRule = this.generateInterestsRule(interests);
      rules.push({
        content: interestsRule,
        order: 7,
      });
    }

    // Rule 8: Sentiment (if set)
    const sentiment = this.getSentiment(agent);
    if (sentiment) {
      const sentimentRule = this.generateSentimentRule(sentiment);
      rules.push({
        content: sentimentRule,
        order: 8,
      });
    }

    // Sort by order to ensure correct sequence
    return rules.sort((a, b) => a.order - b.order);
  }

  // NOTE: generateDatetimeRule() and generateLanguageRule() removed
  // - Datetime is now embedded in system prompt via PromptTransformationService
  // - Language is now in client agent config rules via MessagePreparationService

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

  private getResponseLength(agent: AgentWithConfig): ResponseLength | null {
    const configs = agent.configs || {};
    const responseLength = configs.response_length;
    if (typeof responseLength === 'string') {
      return responseLength as ResponseLength;
    }
    return null;
  }

  private getAge(agent: AgentWithConfig): number | undefined {
    const configs = agent.configs || {};
    const age = configs.age;
    if (typeof age === 'number') {
      return age;
    }
    return undefined;
  }

  private getGender(agent: AgentWithConfig): Gender | null {
    const configs = agent.configs || {};
    const gender = configs.gender;
    if (typeof gender === 'string') {
      return gender as Gender;
    }
    return null;
  }

  private getPersonality(agent: AgentWithConfig): string | null {
    const configs = agent.configs || {};
    const personality = configs.personality;
    if (typeof personality === 'string') {
      return personality;
    }
    return null;
  }

  private getInterests(agent: AgentWithConfig): string[] | null {
    const configs = agent.configs || {};
    const interests = configs.interests;
    if (Array.isArray(interests)) {
      return interests.filter((i): i is string => typeof i === 'string');
    }
    return null;
  }

  private getSentiment(agent: AgentWithConfig): Sentiment | null {
    const configs = agent.configs || {};
    const sentiment = configs.sentiment;
    if (typeof sentiment === 'string') {
      return sentiment as Sentiment;
    }
    return null;
  }

  private generateResponseLengthRule(responseLength: ResponseLength): string {
    if (responseLength === ResponseLength.ADAPT) {
      return OPENAI_PROMPTS.CONFIG_BASED_RULES.RESPONSE_LENGTH.ADAPT;
    }
    return OPENAI_PROMPTS.CONFIG_BASED_RULES.RESPONSE_LENGTH.FIXED(
      responseLength
    );
  }

  private generateAgeRule(age: number): string {
    if (age < 13) {
      return OPENAI_PROMPTS.CONFIG_BASED_RULES.AGE.CHILD(age);
    } else if (age < 18) {
      return OPENAI_PROMPTS.CONFIG_BASED_RULES.AGE.TEENAGER(age);
    } else if (age < 30) {
      return OPENAI_PROMPTS.CONFIG_BASED_RULES.AGE.YOUNG_ADULT(age);
    } else if (age < 50) {
      return OPENAI_PROMPTS.CONFIG_BASED_RULES.AGE.MATURE_ADULT(age);
    } else if (age < 70) {
      return OPENAI_PROMPTS.CONFIG_BASED_RULES.AGE.MIDDLE_AGED(age);
    } else {
      return OPENAI_PROMPTS.CONFIG_BASED_RULES.AGE.ELDER(age);
    }
  }

  private generateGenderRule(gender: Gender): string {
    return OPENAI_PROMPTS.CONFIG_BASED_RULES.GENDER(gender);
  }

  private generatePersonalityRule(personality: string): string {
    return OPENAI_PROMPTS.CONFIG_BASED_RULES.PERSONALITY(personality);
  }

  private generateInterestsRule(interests: string[]): string {
    const interestsList = interests.join(', ');
    return OPENAI_PROMPTS.CONFIG_BASED_RULES.INTERESTS(interestsList);
  }

  private generateSentimentRule(sentiment: Sentiment): string {
    return OPENAI_PROMPTS.CONFIG_BASED_RULES.SENTIMENT(sentiment);
  }
}
