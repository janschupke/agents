import { Injectable, Logger } from '@nestjs/common';
import { MessageRole } from '../../common/enums/message-role.enum';
import { BehaviorRulesUtil } from '../../common/utils/behavior-rules.util';
import { SystemConfigService } from '../../system-config/system-config.service';
import { LanguageAssistantService } from '../../agent/services/language-assistant.service';
import { AgentConfigService } from '../../agent/services/agent-config.service';
import { AgentType } from '../../common/enums/agent-type.enum';
import { NUMERIC_CONSTANTS } from '../../common/constants/numeric.constants';
import { OPENAI_PROMPTS } from '../../common/constants/openai-prompts.constants';
import { ResponseLength } from '../../common/enums/response-length.enum';
import { Gender } from '../../common/enums/gender.enum';
import { Sentiment } from '../../common/enums/sentiment.enum';
import { PersonalityType } from '@openai/shared-types';
import { PromptTransformationService } from './prompt-transformation.service';
import { BehaviorRulesTransformationService } from './behavior-rules-transformation.service';
import type { AgentArchetype } from '@prisma/client';

interface MessageForOpenAI {
  role: MessageRole;
  content: string;
}

export interface AgentConfig {
  system_prompt?: string;
  behavior_rules?: string;
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
}

@Injectable()
export class MessagePreparationService {
  private readonly logger = new Logger(MessagePreparationService.name);

  constructor(
    private readonly systemConfigService: SystemConfigService,
    private readonly languageAssistantService: LanguageAssistantService,
    private readonly agentConfigService: AgentConfigService,
    private readonly promptTransformationService: PromptTransformationService,
    private readonly behaviorRulesTransformationService: BehaviorRulesTransformationService
  ) {}

  /**
   * Prepare messages array for OpenAI API call
   * Handles: system prompts, behavior rules, memory context, and user messages
   *
   * Message Order:
   * 1. System prompt (by agent type) - SYSTEM role
   *    - Merged from: Main system prompt + Agent type-specific system prompt + Agent archetype system prompt
   *    - Includes current time embedded in the prompt
   * 2. System behavior rules (by agent type) - SYSTEM role
   *    - Merged from: Main system behavior rules + Agent type-specific behavior rules
   *    - Transformed from array to single message
   * 3. Client agent config rules (system) - SYSTEM role
   *    - Generated from agent config values (response_length, age, gender, personality, sentiment, interests)
   *    - Includes language rule if set
   *    - Transformed from array to single message
   * 4. Client agent description (user prompt) - USER role
   *    - Agent's system_prompt field
   * 5. Client agent config rules (user) - USER role
   *    - Agent's behavior_rules field
   *    - Transformed from array to single message
   * 6. Word parsing instruction (language assistants only) - SYSTEM role
   * 7. Memory context - SYSTEM role
   * 8. Conversation history (user/assistant messages)
   * 9. Current user message - USER role
   */
  async prepareMessagesForOpenAI(
    existingMessages: MessageForOpenAI[],
    agentConfig: AgentConfig,
    userMessage: string,
    relevantMemories: string[],
    agentArchetype: AgentArchetype | null = null,
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

    // 1. System prompt (by agent type) - merged and with current time
    await this.addSystemPrompt(
      messagesForAPI,
      agentConfig,
      agentArchetype,
      currentDateTime
    );

    // 2. System behavior rules (by agent type) - merged and transformed
    await this.addSystemBehaviorRules(messagesForAPI, agentConfig);

    // 3. Client agent config rules (system) - generated from config values
    this.addClientAgentConfigRules(messagesForAPI, agentConfig);

    // 4. Client agent description (user prompt)
    if (agentConfig.system_prompt) {
      this.logger.debug('Adding client system prompt as user message');
      messagesForAPI.push({
        role: MessageRole.USER,
        content: String(agentConfig.system_prompt),
      });
    }

    // 5. Client agent config rules (user) - transformed
    if (agentConfig.behavior_rules) {
      this.logger.debug('Adding client behavior rules as user message');
      this.addClientBehaviorRules(messagesForAPI, agentConfig);
    }

    // 6. Word parsing instruction (only for language assistants) - SYSTEM role
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
      this.logger.debug('No memory contexts to add (relevantMemories is empty)');
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
    const memoryContext = `Relevant context from previous conversations:\n${relevantMemories
      .map((m, i) => `${i + 1}. ${m}`)
      .join('\n\n')}`;

    // Add memory context as a system message after rules but before conversation history
    messagesForAPI.push({
      role: MessageRole.SYSTEM,
      content: memoryContext,
    });
  }

  /**
   * Add system prompt (by agent type) - SYSTEM role
   * Merged from: Main system prompt + Agent type-specific system prompt + Agent archetype system prompt
   * Includes current time embedded in the prompt
   */
  private async addSystemPrompt(
    messagesForAPI: MessageForOpenAI[],
    agentConfig: AgentConfig,
    agentArchetype: AgentArchetype | null,
    currentDateTime: Date
  ): Promise<void> {
    try {
      // 1. Get main system prompt (by agent type, falls back to main)
      const mainPrompt =
        await this.systemConfigService.getSystemPromptByAgentType(
          agentConfig.agentType || null
        );

      this.logger.debug(
        `Retrieved system prompt for agent type: ${agentConfig.agentType || 'main'} (length: ${mainPrompt?.length || 0})`
      );

      // 2. Get agent archetype system prompt (if exists)
      const archetypePrompt = agentArchetype?.systemPrompt || null;

      // 3. Merge prompts
      const mergedPrompt = this.promptTransformationService.mergeSystemPrompts([
        mainPrompt,
        archetypePrompt,
      ]);

      // 4. Embed current time
      const finalPrompt = this.promptTransformationService.embedCurrentTime(
        mergedPrompt,
        currentDateTime
      );

      this.logger.debug(
        `Merged system prompt (length: ${finalPrompt.trim().length})`
      );

      // 5. Add as first SYSTEM message
      if (finalPrompt.trim().length > 0) {
        this.logger.debug('Adding merged system prompt as first message');
        messagesForAPI.unshift({
          role: MessageRole.SYSTEM,
          content: finalPrompt.trim(),
        });
      } else {
        this.logger.debug(
          'System prompt is empty, not adding to messages'
        );
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
   * Add client behavior rules (user) - USER role
   * Transformed from array to single message
   */
  private addClientBehaviorRules(
    messagesForAPI: MessageForOpenAI[],
    agentConfig: AgentConfig
  ): void {
    const behaviorRules = BehaviorRulesUtil.parse(agentConfig.behavior_rules!);

    if (behaviorRules.length > 0) {
      const rulesMessage =
        this.behaviorRulesTransformationService.transformRulesToMessage(
          behaviorRules,
          { role: MessageRole.USER }
        );

      if (rulesMessage.trim().length > 0) {
        this.logger.debug('Adding client behavior rules as user message');
        messagesForAPI.push({
          role: MessageRole.USER,
          content: rulesMessage.trim(),
        });
      }
    }
  }

  /**
   * Add client agent config rules (system) - SYSTEM role
   * Generated from agent config values (response_length, age, gender, personality, sentiment, interests)
   * Includes language rule if set
   * Transformed from array to single message
   */
  private addClientAgentConfigRules(
    messagesForAPI: MessageForOpenAI[],
    agentConfig: AgentConfig
  ): void {
    // 1. Generate rules from config values
    const configRules: string[] = [];

    // Language rule (moved from ConfigurationRulesService)
    if (agentConfig.language) {
      configRules.push(
        OPENAI_PROMPTS.CONFIGURATION_RULES.LANGUAGE(agentConfig.language)
      );
    }

    // Other config-based rules (response_length, age, gender, etc.)
    const configs: Record<string, unknown> = {};
    if (agentConfig.response_length !== undefined) {
      configs.response_length = agentConfig.response_length;
    }
    if (agentConfig.age !== undefined) {
      configs.age = agentConfig.age;
    }
    if (agentConfig.gender !== undefined) {
      configs.gender = agentConfig.gender;
    }
    if (agentConfig.personality !== undefined) {
      configs.personality = agentConfig.personality;
    }
    if (agentConfig.sentiment !== undefined) {
      configs.sentiment = agentConfig.sentiment;
    }
    if (agentConfig.interests !== undefined) {
      configs.interests = agentConfig.interests;
    }

    const generatedRules =
      this.agentConfigService.generateBehaviorRulesFromConfig(configs);
    configRules.push(...generatedRules);

    // 2. Transform to single SYSTEM message
    if (configRules.length > 0) {
      const rulesMessage =
        this.behaviorRulesTransformationService.transformRulesToMessage(
          configRules,
          { role: MessageRole.SYSTEM }
        );

      if (rulesMessage.trim().length > 0) {
        this.logger.debug(
          `Adding ${configRules.length} client agent config rules as system message`
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
