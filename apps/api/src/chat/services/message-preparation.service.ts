import { Injectable, Logger } from '@nestjs/common';
import { MessageRole } from '../../common/enums/message-role.enum';
import { BehaviorRulesUtil } from '../../common/utils/behavior-rules.util';
import { SystemConfigRepository } from '../../system-config/system-config.repository';

export interface MessageForOpenAI {
  role: MessageRole;
  content: string;
}

export interface AgentConfig {
  system_prompt?: string;
  behavior_rules?: string;
}

@Injectable()
export class MessagePreparationService {
  private readonly logger = new Logger(MessagePreparationService.name);

  constructor(
    private readonly systemConfigRepository: SystemConfigRepository
  ) {}

  /**
   * Prepare messages array for OpenAI API call
   * Handles: system prompts, behavior rules, memory context, and user messages
   */
  async prepareMessagesForOpenAI(
    existingMessages: MessageForOpenAI[],
    agentConfig: AgentConfig,
    userMessage: string,
    relevantMemories: string[]
  ): Promise<MessageForOpenAI[]> {
    this.logger.debug(
      `Preparing messages for OpenAI. Existing messages: ${existingMessages.length}, Memories: ${relevantMemories.length}`
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

    // Add system-wide behavior rules
    await this.addSystemBehaviorRules(messagesForAPI, agentConfig);

    // Add agent-specific behavior rules
    if (agentConfig.behavior_rules) {
      this.logger.debug('Adding agent-specific behavior rules');
      this.addAgentBehaviorRules(messagesForAPI, agentConfig);
    }

    // Add word parsing instruction for assistant responses
    // This requests OpenAI to parse words in the response for immediate highlighting
    this.addWordParsingInstruction(messagesForAPI);

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
   * Add instruction for assistant to include translations in response (required)
   * This ensures translations are included in the initial response, eliminating need for second API call
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
