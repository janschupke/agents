import { Injectable, Logger } from '@nestjs/common';
import { MessageRole } from '../../common/enums/message-role.enum';
import { BehaviorRulesUtil } from '../../common/utils/behavior-rules.util';
import { SystemConfigRepository } from '../../system-config/system-config.repository';
import { ConfigurationRulesService } from './configuration-rules.service';
import { LanguageAssistantService } from '../../agent/services/language-assistant.service';
import { AgentWithConfig } from '../../common/interfaces/agent.interface';
import { AgentType } from '../../common/enums/agent-type.enum';
import { NUMERIC_CONSTANTS } from '../../common/constants/numeric.constants';

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
   * Message Order:
   * 1. Code-defined rules (datetime, language, etc.) - SYSTEM role
   * 2. Admin-defined system behavior rules - SYSTEM role
   * 3. Client config system prompt - USER role
   * 4. Client behavior rules - USER role
   * 5. Word parsing instruction (only for language assistants) - SYSTEM role
   * 6. Conversation history (user/assistant messages)
   * 7. Current user message
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

    // 1. Code-defined rules (datetime, language, etc.) - SYSTEM role
    this.addConfigurationRules(messagesForAPI, agentConfig, currentDateTime);

    // 2. Admin-defined system behavior rules - SYSTEM role
    await this.addSystemBehaviorRules(messagesForAPI);

    // 3. Client config system prompt - USER role
    if (agentConfig.system_prompt) {
      this.logger.debug('Adding client system prompt as user message');
      messagesForAPI.push({
        role: MessageRole.USER,
        content: String(agentConfig.system_prompt),
      });
    }

    // 4. Client behavior rules - USER role
    if (agentConfig.behavior_rules) {
      this.logger.debug('Adding client behavior rules as user message');
      this.addClientBehaviorRules(messagesForAPI, agentConfig);
    }

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
      this.logger.debug(`Adding ${relevantMemories.length} memory contexts`);
      this.addMemoryContext(messagesForAPI, relevantMemories);
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
   * Add system-wide behavior rules (admin-defined) - SYSTEM role
   */
  private async addSystemBehaviorRules(
    messagesForAPI: MessageForOpenAI[]
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
        // Add as system message after code-defined rules
        messagesForAPI.push({
          role: MessageRole.SYSTEM,
          content: systemBehaviorRulesMessage,
        });
      }
    }
  }

  /**
   * Add client behavior rules - USER role
   */
  private addClientBehaviorRules(
    messagesForAPI: MessageForOpenAI[],
    agentConfig: AgentConfig
  ): void {
    const behaviorRules = BehaviorRulesUtil.parse(agentConfig.behavior_rules!);

    if (behaviorRules.length > 0) {
      const behaviorRulesMessage =
        BehaviorRulesUtil.formatAgentRules(behaviorRules);

      if (behaviorRulesMessage.length > 0) {
        // Add as user message after client system prompt
        messagesForAPI.push({
          role: MessageRole.USER,
          content: behaviorRulesMessage,
        });
      }
    }
  }

  /**
   * Add configuration rules (datetime, language, etc.) - SYSTEM role
   * These are code-defined rules that come first
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

    const configurationRules =
      this.configurationRulesService.generateConfigurationRules(
        agent,
        currentDateTime
      );

    if (configurationRules.length === 0) {
      return;
    }

    const configurationRulesMessage =
      this.configurationRulesService.formatConfigurationRules(
        configurationRules
      );

    if (configurationRulesMessage.length > 0) {
      // Add as first system message (code-defined rules come first)
      messagesForAPI.push({
        role: MessageRole.SYSTEM,
        content: configurationRulesMessage,
      });
    }
  }

  /**
   * Add instruction for assistant to include translations in response (required)
   * ONLY called for language assistants
   */
  private addWordParsingInstruction(messagesForAPI: MessageForOpenAI[]): void {
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
