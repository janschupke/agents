import { Injectable } from '@nestjs/common';
import { AgentWithConfig } from '../../common/interfaces/agent.interface';
import { LanguageAssistantService } from '../../agent/services/language-assistant.service';
import { ResponseLength } from '../../common/enums/response-length.enum';
import { Gender } from '../../common/enums/gender.enum';
import { Sentiment } from '../../common/enums/sentiment.enum';

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

    // Rule 3: Response length (if set)
    const responseLength = this.getResponseLength(agent);
    if (responseLength) {
      const responseLengthRule = this.generateResponseLengthRule(responseLength);
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
      return 'Adapt your response length to the user\'s message and context';
    }
    return `Respond with messages of ${responseLength} length`;
  }

  private generateAgeRule(age: number): string {
    // Tailor the prompt to make the agent speak in the appropriate age style
    if (age < 13) {
      return `You are ${age} years old. Speak like a child - use simpler language, show curiosity and wonder, and express yourself in an age-appropriate way.`;
    } else if (age < 18) {
      return `You are ${age} years old. Speak like a teenager - use casual language, show enthusiasm, and express yourself in a way that reflects teenage interests and concerns.`;
    } else if (age < 30) {
      return `You are ${age} years old. Speak like a young adult - use modern, energetic language and show interest in contemporary topics and experiences.`;
    } else if (age < 50) {
      return `You are ${age} years old. Speak like a mature adult - use balanced, thoughtful language and show experience and wisdom in your communication.`;
    } else if (age < 70) {
      return `You are ${age} years old. Speak like a middle-aged adult - use refined language, show life experience, and communicate with wisdom and perspective.`;
    } else {
      return `You are ${age} years old. Speak like an elder - use thoughtful, wise language, draw from extensive life experience, and communicate with patience and depth.`;
    }
  }

  private generateGenderRule(gender: Gender): string {
    return `You are ${gender}`;
  }

  private generatePersonalityRule(personality: string): string {
    return `Your personality is ${personality}`;
  }

  private generateInterestsRule(interests: string[]): string {
    const interestsList = interests.join(', ');
    return `These are your interests: ${interestsList}`;
  }

  private generateSentimentRule(sentiment: Sentiment): string {
    return `You feel ${sentiment} toward the user`;
  }
}
