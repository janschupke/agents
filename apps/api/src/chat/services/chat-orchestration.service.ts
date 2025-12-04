import { Injectable, Logger } from '@nestjs/common';
import {
  AgentNotFoundException,
  SessionNotFoundException,
  ApiKeyRequiredException,
} from '../../common/exceptions';
import { AgentRepository } from '../../agent/agent.repository';
import { AgentConfigService } from '../../agent/services/agent-config.service';
import { LanguageAssistantService } from '../../agent/services/language-assistant.service';
import { SessionRepository } from '../../session/session.repository';
import { MessageRepository } from '../../message/message.repository';
import { AgentMemoryService } from '../../memory/agent-memory.service';
import { ApiCredentialsService } from '../../api-credentials/api-credentials.service';
import { WordTranslationService } from '../../message-translation/word-translation.service';
import { SavedWordService } from '../../saved-word/saved-word.service';
import { MessageRole } from '../../common/enums/message-role.enum';
import { MEMORY_CONFIG } from '../../common/constants/api.constants.js';
import { MAGIC_STRINGS } from '../../common/constants/error-messages.constants.js';
import {
  MessagePreparationService,
  AgentConfig,
} from './message-preparation.service';
import { ResponseLength } from '../../common/enums/response-length.enum';
import { Gender } from '../../common/enums/gender.enum';
import { Sentiment } from '../../common/enums/sentiment.enum';
import { PersonalityType } from '@openai/shared-types';
import { OpenAIChatService } from './openai-chat.service';
import { TranslationExtractionService } from './translation-extraction.service';
import { AgentWithConfig } from '../../common/interfaces/agent.interface';
import type OpenAI from 'openai';

interface SendMessageContext {
  agentId: number;
  userId: string;
  message: string;
  sessionId?: number;
}

interface SendMessageResult {
  response: string;
  session: { id: number; session_name: string | null };
  rawRequest: unknown;
  rawResponse: OpenAI.Chat.Completions.ChatCompletion;
  userMessageId: number;
  assistantMessageId: number;
  translation?: string;
  wordTranslations?: Array<{
    originalWord: string;
    translation: string;
    sentenceContext?: string;
  }>;
  savedWordMatches?: Array<{
    originalWord: string;
    savedWordId: number;
    translation: string;
    pinyin: string | null;
  }>;
}

/**
 * Service responsible for orchestrating the chat flow
 * Handles session management, message preparation, OpenAI calls, and memory management
 */
@Injectable()
export class ChatOrchestrationService {
  private readonly logger = new Logger(ChatOrchestrationService.name);

  constructor(
    private readonly agentRepository: AgentRepository,
    private readonly agentConfigService: AgentConfigService,
    private readonly languageAssistantService: LanguageAssistantService,
    private readonly sessionRepository: SessionRepository,
    private readonly messageRepository: MessageRepository,
    private readonly agentMemoryService: AgentMemoryService,
    private readonly apiCredentialsService: ApiCredentialsService,
    private readonly wordTranslationService: WordTranslationService,
    private readonly savedWordService: SavedWordService,
    private readonly messagePreparationService: MessagePreparationService,
    private readonly openaiChatService: OpenAIChatService,
    private readonly translationExtractionService: TranslationExtractionService
  ) {}

  /**
   * Validate agent access and return agent with config
   */
  private async validateAgentAccess(
    agentId: number,
    userId: string
  ): Promise<AgentWithConfig> {
    const agent = await this.agentRepository.findByIdWithConfig(
      agentId,
      userId
    );
    if (!agent) {
      throw new AgentNotFoundException(agentId);
    }
    return agent;
  }

  /**
   * Validate session access and return session
   */
  private async validateSessionAccess(
    sessionId: number,
    agentId: number,
    userId: string
  ): Promise<{ id: number; agentId: number; sessionName: string | null }> {
    const session = await this.sessionRepository.findByIdAndUserId(
      sessionId,
      userId
    );
    if (!session || session.agentId !== agentId) {
      throw new SessionNotFoundException(sessionId);
    }
    return session;
  }

  /**
   * Orchestrate sending a message through the chat flow
   */
  async sendMessage(context: SendMessageContext): Promise<SendMessageResult> {
    this.logger.log(
      `Sending message for agent ${context.agentId}, user ${context.userId}, sessionId: ${context.sessionId || 'new'}`
    );

    // Check if user has API key
    const apiKey = await this.apiCredentialsService.getApiKey(
      context.userId,
      MAGIC_STRINGS.OPENAI_PROVIDER
    );
    if (!apiKey) {
      this.logger.warn(`No API key found for user ${context.userId}`);
      throw new ApiKeyRequiredException();
    }

    // Load agent with config
    const agent = await this.validateAgentAccess(
      context.agentId,
      context.userId
    );
    const mergedConfig = this.agentConfigService.mergeAgentConfig(
      agent.configs as Record<string, unknown>
    );
    const agentConfig: AgentConfig = {
      system_prompt: mergedConfig.system_prompt as string | undefined,
      behavior_rules: mergedConfig.behavior_rules as string | undefined,
      temperature: mergedConfig.temperature as number | undefined,
      model: mergedConfig.model as string | undefined,
      max_tokens: mergedConfig.max_tokens as number | undefined,
      agentType: agent.agentType,
      language: agent.language,
      response_length: mergedConfig.response_length as
        | ResponseLength
        | undefined,
      age: mergedConfig.age as number | undefined,
      gender: mergedConfig.gender as Gender | undefined,
      personality: mergedConfig.personality as PersonalityType | undefined,
      sentiment: mergedConfig.sentiment as Sentiment | undefined,
      interests: mergedConfig.interests as string[] | undefined,
    };
    this.logger.debug(`Loaded agent ${context.agentId} with config`);

    // Get or create session
    const session = await this.getOrCreateSession(
      context.agentId,
      context.userId,
      context.sessionId
    );

    // Load existing messages
    const existingMessages =
      await this.messageRepository.findAllBySessionIdForOpenAI(session.id);
    this.logger.debug(`Loaded ${existingMessages.length} existing messages`);

    // Retrieve relevant memories using vector similarity
    const relevantMemories = await this.getRelevantMemories(
      context.agentId,
      context.userId,
      context.message,
      apiKey
    );

    // Prepare messages for OpenAI using MessagePreparationService
    const messagesForAPI =
      await this.messagePreparationService.prepareMessagesForOpenAI(
        existingMessages,
        agentConfig,
        context.message,
        relevantMemories
      );

    // Create OpenAI request using OpenAIChatService
    const openaiRequest = this.openaiChatService.createOpenAIRequest(
      messagesForAPI,
      agentConfig
    );

    // Save user message to database with raw request
    const userMessage = await this.messageRepository.create(
      session.id,
      MessageRole.USER,
      context.message,
      undefined,
      openaiRequest,
      undefined
    );
    this.logger.debug(`Saved user message ${userMessage.id}`);

    // Call OpenAI API using OpenAIChatService
    const { response, completion } =
      await this.openaiChatService.createChatCompletion(
        apiKey,
        openaiRequest,
        context.userId
      );
    this.logger.log(
      `Received response from OpenAI (length: ${response.length})`
    );

    // Extract translations from response
    const {
      words: extractedWords,
      fullTranslation: extractedTranslation,
      cleanedResponse,
      extracted: translationsExtracted,
    } = this.translationExtractionService.extractTranslationsFromResponse(
      response
    );

    // Save assistant message (always saved, even if translations failed)
    const assistantMessage = await this.messageRepository.create(
      session.id,
      MessageRole.ASSISTANT,
      cleanedResponse,
      {
        model: agentConfig.model,
        temperature: agentConfig.temperature,
      },
      undefined,
      completion
    );
    this.logger.debug(`Saved assistant message ${assistantMessage.id}`);

    // Save extracted translations if available (only for language assistants)
    if (this.languageAssistantService.isLanguageAssistant(agent)) {
      await this.saveTranslations(
        assistantMessage.id,
        cleanedResponse,
        extractedWords,
        extractedTranslation,
        translationsExtracted,
        apiKey
      );
    }

    // Get word translations and saved word matches for response (only for language assistants)
    let wordTranslations: Array<{
      originalWord: string;
      translation: string;
      sentenceContext?: string;
    }> = [];
    let savedWordMatches: Array<{
      originalWord: string;
      savedWordId: number;
      translation: string;
      pinyin: string | null;
    }> = [];

    if (this.languageAssistantService.isLanguageAssistant(agent)) {
      const result = await this.getWordTranslationsAndMatches(
        assistantMessage.id,
        context.userId,
        extractedWords,
        translationsExtracted
      );
      wordTranslations = result.wordTranslations;
      savedWordMatches = result.savedWordMatches;
    }

    // Save memory periodically
    await this.saveMemoryIfNeeded(
      context.agentId,
      context.userId,
      session.id,
      session.sessionName,
      apiKey
    );

    return {
      response: cleanedResponse,
      session: {
        id: session.id,
        session_name: session.sessionName,
      },
      rawRequest: openaiRequest,
      rawResponse: completion,
      userMessageId: userMessage.id,
      assistantMessageId: assistantMessage.id,
      translation:
        this.languageAssistantService.isLanguageAssistant(agent) &&
        translationsExtracted
          ? extractedTranslation
          : undefined,
      wordTranslations:
        this.languageAssistantService.isLanguageAssistant(agent) &&
        wordTranslations.length > 0
          ? wordTranslations
          : undefined,
      savedWordMatches:
        this.languageAssistantService.isLanguageAssistant(agent) &&
        savedWordMatches.length > 0
          ? savedWordMatches
          : undefined,
    };
  }

  /**
   * Get or create session
   */
  private async getOrCreateSession(
    agentId: number,
    userId: string,
    sessionId?: number
  ): Promise<{ id: number; agentId: number; sessionName: string | null }> {
    if (sessionId) {
      const session = await this.validateSessionAccess(
        sessionId,
        agentId,
        userId
      );
      this.logger.debug(`Using existing session ${sessionId}`);
      return session;
    } else {
      let session = await this.sessionRepository.findLatestByAgentId(
        agentId,
        userId
      );
      if (!session) {
        session = await this.sessionRepository.create(userId, agentId);
        this.logger.log(
          `Created new session ${session.id} for agent ${agentId}`
        );
      } else {
        this.logger.debug(`Using latest session ${session.id}`);
      }
      return session;
    }
  }

  /**
   * Get relevant memories for context
   */
  private async getRelevantMemories(
    agentId: number,
    userId: string,
    message: string,
    apiKey: string
  ): Promise<string[]> {
    try {
      this.logger.debug(
        `Retrieving memories for agent ${agentId}, user ${userId}, query: ${message.substring(0, 50)}...`
      );
      const relevantMemories =
        await this.agentMemoryService.getMemoriesForContext(
          agentId,
          userId,
          message,
          apiKey
        );
      if (relevantMemories.length > 0) {
        this.logger.log(
          `Found ${relevantMemories.length} relevant memories for agent ${agentId}`
        );
        this.logger.debug(
          `Memory contexts: ${relevantMemories.map((m) => m.substring(0, 50)).join('; ')}`
        );
      } else {
        this.logger.debug(
          `No relevant memories found for agent ${agentId}, user ${userId}`
        );
      }
      return relevantMemories;
    } catch (error) {
      this.logger.error('Error retrieving memories:', error);
      // Continue without memories if retrieval fails
      return [];
    }
  }

  /**
   * Save translations if available
   */
  private async saveTranslations(
    messageId: number,
    messageContent: string,
    extractedWords: Array<{ originalWord: string; translation: string }>,
    extractedTranslation: string | undefined,
    translationsExtracted: boolean,
    apiKey: string
  ): Promise<void> {
    if (
      translationsExtracted &&
      extractedWords.length > 0 &&
      extractedTranslation
    ) {
      try {
        await this.wordTranslationService.saveExtractedTranslations(
          messageId,
          extractedWords,
          extractedTranslation,
          messageContent
        );
        this.logger.debug(
          `Saved translations for assistant message ${messageId}`
        );
      } catch (error) {
        this.logger.error('Error saving extracted translations:', error);
        // Continue without translations - message still works
      }
    } else {
      // Save words without translations (for highlighting, translation can be requested manually)
      if (extractedWords.length > 0) {
        try {
          await this.wordTranslationService.saveParsedWords(
            messageId,
            extractedWords.map((w) => ({ originalWord: w.originalWord })),
            messageContent
          );
          this.logger.debug(
            `Saved words without translations for assistant message ${messageId}`
          );
        } catch (error) {
          this.logger.error('Error saving words:', error);
          // Continue without words - highlighting won't work but message still works
        }
      } else {
        // Try to parse words using OpenAI (fallback)
        try {
          await this.wordTranslationService.parseWordsInMessage(
            messageId,
            messageContent,
            apiKey
          );
          this.logger.debug(`Parsed words for message ${messageId}`);
        } catch (error) {
          this.logger.error('Error parsing words:', error);
          // Continue without word parsing - highlighting will still work if words exist
        }
      }
    }
  }

  /**
   * Get word translations and saved word matches
   */
  private async getWordTranslationsAndMatches(
    messageId: number,
    userId: string,
    extractedWords: Array<{ originalWord: string; translation: string }>,
    translationsExtracted: boolean
  ): Promise<{
    wordTranslations: Array<{
      originalWord: string;
      translation: string;
      sentenceContext?: string;
    }>;
    savedWordMatches: Array<{
      originalWord: string;
      savedWordId: number;
      translation: string;
      pinyin: string | null;
    }>;
  }> {
    let parsedWordTranslations: Array<{
      originalWord: string;
      translation: string;
      sentenceContext?: string;
    }> = [];
    let savedWordMatches: Array<{
      originalWord: string;
      savedWordId: number;
      translation: string;
      pinyin: string | null;
    }> = [];

    try {
      if (translationsExtracted && extractedWords.length > 0) {
        // Use extracted translations
        parsedWordTranslations = extractedWords.map((w) => ({
          originalWord: w.originalWord,
          translation: w.translation,
        }));
      } else {
        // Get parsed words (may have empty translations)
        parsedWordTranslations =
          await this.wordTranslationService.getWordTranslationsForMessage(
            messageId
          );
      }

      if (parsedWordTranslations.length > 0) {
        // Extract words from parsed word translations
        const words = parsedWordTranslations.map((wt) => wt.originalWord);
        savedWordMatches = await this.savedWordService.findMatchingWords(
          userId,
          words
        );
        this.logger.debug(
          `Found ${savedWordMatches.length} saved word matches for message ${messageId}`
        );
      }
    } catch (error) {
      this.logger.error('Error finding saved word matches:', error);
      // Continue without saved word matches
    }

    return { wordTranslations: parsedWordTranslations, savedWordMatches };
  }

  /**
   * Save memory if needed (periodically)
   */
  private async saveMemoryIfNeeded(
    agentId: number,
    userId: string,
    sessionId: number,
    sessionName: string | null,
    apiKey: string
  ): Promise<void> {
    const allMessages =
      await this.messageRepository.findAllBySessionIdForOpenAI(sessionId);
    const shouldSaveMemory =
      allMessages.length === 1 || // Save on first message
      (allMessages.length > 0 &&
        allMessages.length % MEMORY_CONFIG.MEMORY_SAVE_INTERVAL === 0);

    if (shouldSaveMemory) {
      try {
        this.logger.debug(
          `Attempting to save memories for agent ${agentId}, session ${sessionId} (${allMessages.length} messages, interval: ${MEMORY_CONFIG.MEMORY_SAVE_INTERVAL})`
        );

        const createdCount = await this.agentMemoryService.createMemory(
          agentId,
          userId,
          sessionId,
          sessionName,
          allMessages,
          apiKey
        );

        if (createdCount > 0) {
          this.logger.log(
            `Successfully created ${createdCount} memories for agent ${agentId}, session ${sessionId} (${allMessages.length} messages)`
          );

          // Check if summarization is needed
          const shouldSummarize = await this.agentMemoryService.shouldSummarize(
            agentId,
            userId
          );
          if (shouldSummarize) {
            // Run summarization asynchronously (don't wait)
            this.agentMemoryService
              .summarizeMemories(agentId, userId, apiKey)
              .catch((error) => {
                this.logger.error('Error during memory summarization:', error);
              });
          }
        } else {
          this.logger.debug(
            `No memories created for agent ${agentId}, session ${sessionId} (likely no insights extracted)`
          );
        }
      } catch (error) {
        this.logger.error(
          `Error saving memories for agent ${agentId}, session ${sessionId}:`,
          error
        );
        // Continue even if memory save fails
      }
    } else {
      this.logger.debug(
        `Skipping memory save for agent ${agentId}, session ${sessionId} (${allMessages.length} messages, not at interval)`
      );
    }
  }
}
