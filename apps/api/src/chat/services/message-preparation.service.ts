import { Injectable, Logger } from '@nestjs/common';
import { MessageRole } from '../../common/enums/message-role.enum';
import { BehaviorRulesUtil } from '../../common/utils/behavior-rules.util';
import { SystemConfigRepository } from '../../system-config/system-config.repository';
import { ConfigurationRulesService } from './configuration-rules.service';
import { LanguageAssistantService } from '../../agent/services/language-assistant.service';
import { AgentWithConfig } from '../../common/interfaces/agent.interface';
import { AgentType } from '../../common/enums/agent-type.enum';

export interface MessageForOpenAI {
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
}

@Injectable()
export class MessagePreparationService {
  private readonly logger = new Logger(MessagePreparationService.name);

  constructor(
    private readonly systemConfigRepository: SystemConfigRepository,
    private readonly configurationRulesService: ConfigurationRulesService,
    private readonly languageAssistantService: LanguageAssistantService
  ) {}

  /**
   * Prepare messages array for OpenAI API call
   * Handles: system prompts, behavior rules, memory context, and user messages
   * 
   * Rule Order:
   * 1. System prompt
   * 2. Admin-defined system behavior rules
   * 3. Configuration rules (datetime, language) - from ConfigurationRulesService
   * 4. User-defined behavior rules
   * 5. Word parsing instruction (only for language assistants)
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

    // Start with existing messages
    const messagesForAPI = [...existingMessages];

    // Add memory context if found
    if (relevantMemories.length > 0) {
      this.logger.debug(`Adding ${relevantMemories.length} memory contexts`);
      this.addMemoryContext(relevantMemories, messagesForAPI);
    }

    // Add system prompt if not already present
    if (agentConfig.system_prompt) {
      this.logger.debug('Adding system prompt');
      this.addSystemPrompt(messagesForAPI, String(agentConfig.system_prompt));
    }

    // Add system-wide behavior rules (admin-defined)
    await this.addSystemBehaviorRules(messagesForAPI, agentConfig);

    // Add configuration rules (datetime, language) - AFTER admin rules, BEFORE user rules
    this.addConfigurationRules(messagesForAPI, agentConfig, currentDateTime);

    // Add agent-specific behavior rules (user-defined)
    if (agentConfig.behavior_rules) {
      this.logger.debug('Adding agent-specific behavior rules');
      this.addAgentBehaviorRules(messagesForAPI, agentConfig);
    }

    // Add word parsing instruction ONLY for language assistants
    const isLanguageAssistant = this.languageAssistantService.isLanguageAssistant({
      agentType: agentConfig.agentType,
    });
    if (isLanguageAssistant) {
      this.logger.debug('Adding word parsing instruction for language assistant');
      this.addWordParsingInstruction(messagesForAPI);
    }

    // Add user message
    messagesForAPI.push({
      role: MessageRole.USER,
      content: userMessage,
    });

    this.logger.debug(`Prepared ${messagesForAPI.length} messages for OpenAI`);
    return messagesForAPI;
  }

  /**
   * Add memory context to messages array
   */
  private addMemoryContext(
    relevantMemories: string[],
    messagesForAPI: MessageForOpenAI[]
  ): void {
    const memoryContext = `Relevant context from previous conversations:\n${relevantMemories
      .map((m, i) => `${i + 1}. ${m}`)
      .join('\n\n')}`;

    const systemMessages = messagesForAPI.filter(
      (m) => m.role === MessageRole.SYSTEM
    );
    const nonSystemMessages = messagesForAPI.filter(
      (m) => m.role !== MessageRole.SYSTEM
    );

    // Clear and rebuild with memory context inserted
    messagesForAPI.length = 0;
    messagesForAPI.push(...systemMessages);
    messagesForAPI.push({
      role: MessageRole.SYSTEM,
      content: memoryContext,
    });
    messagesForAPI.push(...nonSystemMessages);
  }

  /**
   * Add system prompt if not already present
   */
  private addSystemPrompt(
    messagesForAPI: MessageForOpenAI[],
    systemPrompt: string
  ): void {
    if (
      !messagesForAPI.some(
        (m) => m.role === MessageRole.SYSTEM && m.content === systemPrompt
      )
    ) {
      messagesForAPI.unshift({
        role: MessageRole.SYSTEM,
        content: systemPrompt,
      });
    }
  }

  /**
   * Add system-wide behavior rules
   */
  private async addSystemBehaviorRules(
    messagesForAPI: MessageForOpenAI[],
    agentConfig: AgentConfig
  ): Promise<void> {
    let systemBehaviorRules: string[] = [];
    try {
      const systemConfig =
        await this.systemConfigRepository.findByKey('behavior_rules');
      if (systemConfig && systemConfig.configValue) {
        systemBehaviorRules = BehaviorRulesUtil.parse(systemConfig.configValue);
      }
    } catch (error) {
      this.logger.error('Error loading system behavior rules:', error);
      // Continue without system rules if loading fails
    }

    if (systemBehaviorRules.length > 0) {
      const systemBehaviorRulesMessage =
        BehaviorRulesUtil.formatSystemRules(systemBehaviorRules);

      if (systemBehaviorRulesMessage.length > 0) {
        // Check if system behavior rules are already present
        if (
          !messagesForAPI.some(
            (m) =>
              m.role === MessageRole.SYSTEM &&
              m.content === systemBehaviorRulesMessage
          )
        ) {
          // Add system behavior rules after system prompt but before agent-specific rules
          const systemPromptIndex = messagesForAPI.findIndex(
            (m) =>
              m.role === MessageRole.SYSTEM &&
              m.content === String(agentConfig.system_prompt || '')
          );

          if (systemPromptIndex >= 0) {
            // Insert after system prompt
            messagesForAPI.splice(systemPromptIndex + 1, 0, {
              role: MessageRole.SYSTEM,
              content: systemBehaviorRulesMessage,
            });
          } else {
            // No system prompt found, add at the beginning
            messagesForAPI.unshift({
              role: MessageRole.SYSTEM,
              content: systemBehaviorRulesMessage,
            });
          }
        }
      }
    }
  }

  /**
   * Add agent-specific behavior rules
   */
  private addAgentBehaviorRules(
    messagesForAPI: MessageForOpenAI[],
    agentConfig: AgentConfig
  ): void {
    const behaviorRules = BehaviorRulesUtil.parse(agentConfig.behavior_rules!);

    // Format behavior rules as a system message
    if (behaviorRules.length > 0) {
      const behaviorRulesMessage =
        BehaviorRulesUtil.formatAgentRules(behaviorRules);

      if (behaviorRulesMessage.length > 0) {
        // Check if behavior rules are already present (exact match)
        if (
          !messagesForAPI.some(
            (m) =>
              m.role === MessageRole.SYSTEM &&
              m.content === behaviorRulesMessage
          )
        ) {
          // Add behavior rules after system prompt but before other system messages
          const systemPromptIndex = messagesForAPI.findIndex(
            (m) =>
              m.role === MessageRole.SYSTEM &&
              m.content === String(agentConfig.system_prompt || '')
          );

          if (systemPromptIndex >= 0) {
            // Insert after system prompt
            messagesForAPI.splice(systemPromptIndex + 1, 0, {
              role: MessageRole.SYSTEM,
              content: behaviorRulesMessage,
            });
          } else {
            // No system prompt found, add at the beginning
            messagesForAPI.unshift({
              role: MessageRole.SYSTEM,
              content: behaviorRulesMessage,
            });
          }
        }
      }
    }
  }

  /**
   * Add configuration rules (datetime, language)
   * These come after admin-defined system rules but before user-defined behavior rules
   */
  private addConfigurationRules(
    messagesForAPI: MessageForOpenAI[],
    agentConfig: AgentConfig,
    currentDateTime: Date
  ): void {
    const agent: AgentWithConfig = {
      id: 0, // Not needed for configuration rules
      name: '',
      description: null,
      avatarUrl: null,
      agentType: agentConfig.agentType || AgentType.GENERAL,
      language: agentConfig.language || null,
      configs: {},
    };

    const configurationRules = this.configurationRulesService.generateConfigurationRules(
      agent,
      currentDateTime
    );

    if (configurationRules.length === 0) {
      return;
    }

    const configurationRulesMessage =
      this.configurationRulesService.formatConfigurationRules(configurationRules);

    if (configurationRulesMessage.length > 0) {
      // Check if configuration rules are already present
      if (
        !messagesForAPI.some(
          (m) =>
            m.role === MessageRole.SYSTEM &&
            m.content === configurationRulesMessage
        )
      ) {
        // Find insertion point: after system prompt and admin rules, before user behavior rules
        // Insert after the last system message (which should be admin rules)
        const lastSystemIndex = messagesForAPI
          .map((m, i) => ({ role: m.role, index: i }))
          .filter((m) => m.role === MessageRole.SYSTEM)
          .pop()?.index;

        if (lastSystemIndex !== undefined) {
          // Insert after last system message
          messagesForAPI.splice(lastSystemIndex + 1, 0, {
            role: MessageRole.SYSTEM,
            content: configurationRulesMessage,
          });
        } else {
          // No system messages found, add at the beginning
          messagesForAPI.unshift({
            role: MessageRole.SYSTEM,
            content: configurationRulesMessage,
          });
        }
      }
    }
  }

  /**
   * Add instruction for assistant to include translations in response (required)
   * ONLY called for language assistants
   */
  private addWordParsingInstruction(
    messagesForAPI: MessageForOpenAI[]
  ): void {
    const wordParsingInstruction = `CRITICAL INSTRUCTION: You MUST translate YOUR OWN RESPONSE (the assistant's message), NOT the user's message.

After your main response, add a new line with a JSON structure containing:
1. Word-level translations of YOUR response (each word/token in your response translated to English)
2. A complete English translation of YOUR entire response

Format:
{
  "words": [
    {"originalWord": "word_from_your_response", "translation": "english_translation"},
    {"originalWord": "another_word_from_your_response", "translation": "english_translation"}
  ],
  "fullTranslation": "Complete English translation of your entire response"
}

Requirements:
- Translate ONLY the words from YOUR response (the assistant's message), not the user's message
- Parse all words/tokens in YOUR response (especially for languages without spaces like Chinese, Japanese)
- Provide English translation for each word considering sentence context
- Provide a complete, natural English translation of YOUR entire response
- The JSON must be valid and parseable
- The "originalWord" values must be words from YOUR response, not from the user's message

Example:
If your response is: "你好，世界！"
Then your JSON should be:
{
  "words": [
    {"originalWord": "你好", "translation": "hello"},
    {"originalWord": "世界", "translation": "world"}
  ],
  "fullTranslation": "Hello, world!"
}

DO NOT translate the user's message. Only translate YOUR response.`;

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
        content: wordParsingInstruction,
      });
    }
  }
}
