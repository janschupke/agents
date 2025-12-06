import { Injectable, Logger } from '@nestjs/common';
import {
  MessageRole,
  AgentType,
  ResponseLength,
  Gender,
  Sentiment,
  PersonalityType,
} from '@openai/shared-types';
import { SystemConfigService } from '../../system-config/system-config.service';
import { LanguageAssistantService } from '../../agent/services/language-assistant.service';
import { NUMERIC_CONSTANTS } from '../../common/constants/numeric.constants';
import { OPENAI_PROMPTS } from '../../common/constants/openai-prompts.constants';
import { PromptTransformationService } from './prompt-transformation.service';
import { BehaviorRulesTransformationService } from './behavior-rules-transformation.service';

interface MessageForOpenAI {
  role: MessageRole;
  content: string;
}

export interface AgentConfig {
  temperature?: number;
  model?: string;
  max_tokens?: number;
  agentType?: AgentType | null;
  language?: string | null;
  response_length?: ResponseLength;
  age?: number;
  gender?: Gender;
  personality?: PersonalityType;
  sentiment?: Sentiment;
  interests?: string[];
  agentName?: string;
  agentDescription?: string;
}

@Injectable()
export class MessagePreparationService {
  private readonly logger = new Logger(MessagePreparationService.name);

  constructor(
    private readonly systemConfigService: SystemConfigService,
    private readonly languageAssistantService: LanguageAssistantService,
    private readonly promptTransformationService: PromptTransformationService,
    private readonly behaviorRulesTransformationService: BehaviorRulesTransformationService
  ) {}

  /**
   * Prepare messages array for OpenAI API call
   * Handles: system prompts, behavior rules, memory context, and user messages
   *
   * Message Order:
   * 1. Global system prompt (per agent type) - SYSTEM role
   *    - From: SystemConfig.system_prompt (filtered by agentType)
   *    - Includes current time embedded in the prompt
   * 2. Global behavior rules (per agent type) - SYSTEM role
   *    - From: SystemConfig.behavior_rules (filtered by agentType)
   *    - Transformed from array to single message
   * 3. User agent config (system) - SYSTEM role
   *    - Generated from agent config values (response_length, age, gender, personality, sentiment, interests)
   *    - Includes language rule if set
   *    - Transformed from array to single message
   * 4. User agent config (user) - USER role
   *    - Agent name and description
   * 5. Word parsing instruction (language assistants only) - SYSTEM role
   * 6. Memory context - SYSTEM role
   * 7. Conversation history (user/assistant messages)
   * 8. Current user message - USER role
   */
  async prepareMessagesForOpenAI(
    existingMessages: MessageForOpenAI[],
    agentConfig: AgentConfig,
    userMessage: string,
    relevantMemories: string[],
    currentDateTime: Date = new Date()
  ): Promise<MessageForOpenAI[]> {
    this.logger.debug(
      `Preparing messages for OpenAI. Agent type: ${agentConfig.agentType || AgentType.GENERAL}, Language: ${agentConfig.language || 'none'}`
    );

    // Limit conversation history to most recent messages (user/assistant only)
    const conversationMessages = existingMessages.filter(
      (msg) =>
        msg.role === MessageRole.USER || msg.role === MessageRole.ASSISTANT
    );
    const limitedConversationMessages = conversationMessages.slice(
      -NUMERIC_CONSTANTS.OPENAI_CHAT_CONTEXT_MESSAGES
    );
    this.logger.debug(
      `Limited conversation history from ${conversationMessages.length} to ${limitedConversationMessages.length} messages`
    );

    // Build messages array in the correct order
    const messagesForAPI: MessageForOpenAI[] = [];

    // 1. Global system prompt (per agent type) - from SystemConfig
    await this.addSystemPrompt(
      messagesForAPI,
      agentConfig,
      currentDateTime
    );

    // 2. Global behavior rules (per agent type) - from SystemConfig
    await this.addSystemBehaviorRules(messagesForAPI, agentConfig);

    // 3. User agent config (system) - generated from config values
    this.addUserAgentConfigRules(messagesForAPI, agentConfig);

    // 4. User agent config (user) - agent name and description
    this.addUserAgentNameAndDescription(messagesForAPI, agentConfig);

    // 5. Word parsing instruction (only for language assistants) - SYSTEM role
    const isLanguageAssistant =
      this.languageAssistantService.isLanguageAssistant({
        agentType: agentConfig.agentType,
      });
    if (isLanguageAssistant) {
      this.logger.debug(
        'Adding word parsing instruction for language assistant'
      );
      this.addWordParsingInstruction(messagesForAPI);
    }

    // Add memory context if found (as system message after rules)
    if (relevantMemories.length > 0) {
      this.logger.debug(
        `Adding ${relevantMemories.length} memory contexts to messages`
      );
      this.addMemoryContext(messagesForAPI, relevantMemories);
    } else {
      this.logger.debug(
        'No memory contexts to add (relevantMemories is empty)'
      );
    }

    // 6. Conversation history (user/assistant messages)
    messagesForAPI.push(...limitedConversationMessages);

    // 7. Current user message
    messagesForAPI.push({
      role: MessageRole.USER,
      content: userMessage,
    });

    this.logger.debug(`Prepared ${messagesForAPI.length} messages for OpenAI`);
    return messagesForAPI;
  }

  /**
   * Add memory context to messages array (as system message)
   */
  private addMemoryContext(
    messagesForAPI: MessageForOpenAI[],
    relevantMemories: string[]
  ): void {
    if (relevantMemories.length > 0) {
      const memoryContext = OPENAI_PROMPTS.MEMORY.CONTEXT(relevantMemories);

      // Add memory context as a system message after rules but before conversation history
      messagesForAPI.push({
        role: MessageRole.SYSTEM,
        content: memoryContext,
      });
    }
  }

  /**
   * Add global system prompt (per agent type) - SYSTEM role
   * From: SystemConfig.system_prompt (filtered by agentType)
   * Includes current time embedded in the prompt
   */
  private async addSystemPrompt(
    messagesForAPI: MessageForOpenAI[],
    agentConfig: AgentConfig,
    currentDateTime: Date
  ): Promise<void> {
    try {
      // Get system prompt (by agent type, falls back to main)
      const systemPrompt =
        await this.systemConfigService.getSystemPromptByAgentType(
          agentConfig.agentType || null
        );

      this.logger.debug(
        `Retrieved system prompt for agent type: ${agentConfig.agentType || 'main'} (length: ${systemPrompt?.length || 0})`
      );

      // Embed current time
      const finalPrompt = systemPrompt
        ? this.promptTransformationService.embedCurrentTime(
            systemPrompt,
            currentDateTime
          )
        : null;

      this.logger.debug(
        `Final system prompt (length: ${finalPrompt?.trim().length || 0})`
      );

      // Add as first SYSTEM message
      if (finalPrompt && finalPrompt.trim().length > 0) {
        this.logger.debug('Adding system prompt as first message');
        messagesForAPI.unshift({
          role: MessageRole.SYSTEM,
          content: finalPrompt.trim(),
        });
      } else {
        this.logger.debug('System prompt is empty, not adding to messages');
      }
    } catch (error) {
      this.logger.error('Error loading system prompt:', error);
      // Continue without system prompt if loading fails
    }
  }

  /**
   * Add system behavior rules (by agent type) - SYSTEM role
   * Merged from: Main system behavior rules + Agent type-specific behavior rules
   * Transformed from array to single message
   */
  private async addSystemBehaviorRules(
    messagesForAPI: MessageForOpenAI[],
    agentConfig: AgentConfig
  ): Promise<void> {
    try {
      // 1. Get main system behavior rules (by agent type, falls back to main)
      const mainRules =
        await this.systemConfigService.getBehaviorRulesByAgentType(
          agentConfig.agentType || null
        );

      this.logger.debug(
        `Retrieved ${mainRules.length} system behavior rules for agent type: ${agentConfig.agentType || 'main'}`
      );

      // 2. Merge and transform to single message
      const rulesMessage =
        this.behaviorRulesTransformationService.mergeAndTransformRules(
          [mainRules],
          {
            role: MessageRole.SYSTEM,
            header: 'System Behavior Rules (Required):',
          }
        );

      this.logger.debug(
        `Transformed system behavior rules to message (length: ${rulesMessage.trim().length})`
      );

      // 3. Add as SYSTEM message
      if (rulesMessage.trim().length > 0) {
        this.logger.debug('Adding system behavior rules as system message');
        messagesForAPI.push({
          role: MessageRole.SYSTEM,
          content: rulesMessage.trim(),
        });
      } else {
        this.logger.debug(
          'System behavior rules message is empty, not adding to messages'
        );
      }
    } catch (error) {
      this.logger.error('Error loading system behavior rules:', error);
      // Continue without system rules if loading fails
    }
  }

  /**
   * Add user agent config (user) - USER role
   * Agent name and description
   */
  private addUserAgentNameAndDescription(
    messagesForAPI: MessageForOpenAI[],
    agentConfig: AgentConfig
  ): void {
    if (agentConfig.agentName || agentConfig.agentDescription) {
      const content = OPENAI_PROMPTS.AGENT_CONFIG.NAME_AND_DESCRIPTION(
        agentConfig.agentName || 'Agent',
        agentConfig.agentDescription
      );

      if (content.trim().length > 0) {
        this.logger.debug('Adding agent name and description as user message');
        messagesForAPI.push({
          role: MessageRole.USER,
          content: content.trim(),
        });
      }
    }
  }

  /**
   * Add user agent config rules (system) - SYSTEM role
   * Generated from agent config values (response_length, age, gender, personality, sentiment, interests)
   * Includes language rule if set
   * Transformed from array to single message
   */
  private addUserAgentConfigRules(
    messagesForAPI: MessageForOpenAI[],
    agentConfig: AgentConfig
  ): void {
    // Generate rules from config values using centralized prompt function
    const configRules = OPENAI_PROMPTS.AGENT_CONFIG.CONFIG_VALUES({
      language: agentConfig.language,
      response_length: agentConfig.response_length,
      age: agentConfig.age,
      gender: agentConfig.gender,
      personality: agentConfig.personality,
      sentiment: agentConfig.sentiment,
      interests: agentConfig.interests,
    });

    // Transform to single SYSTEM message
    if (configRules.length > 0) {
      const rulesMessage =
        this.behaviorRulesTransformationService.transformRulesToMessage(
          configRules,
          { role: MessageRole.SYSTEM }
        );

      if (rulesMessage.trim().length > 0) {
        this.logger.debug(
          `Adding ${configRules.length} user agent config rules as system message`
        );
        messagesForAPI.push({
          role: MessageRole.SYSTEM,
          content: rulesMessage.trim(),
        });
      }
    }
  }

  /**
   * Add instruction for assistant to include translations in response (required)
   * ONLY called for language assistants
   */
  private addWordParsingInstruction(messagesForAPI: MessageForOpenAI[]): void {
    // Check if word parsing instruction is already present
    if (
      !messagesForAPI.some(
        (m) =>
          m.role === MessageRole.SYSTEM &&
          m.content.includes('word parsing') &&
          m.content.includes('JSON structure')
      )
    ) {
      // Add as a system message after behavior rules
      messagesForAPI.push({
        role: MessageRole.SYSTEM,
        content: OPENAI_PROMPTS.WORD_PARSING.INSTRUCTION,
      });
    }
  }
}
