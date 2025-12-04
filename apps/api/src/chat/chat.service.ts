import { Injectable, Logger } from '@nestjs/common';
import {
  AgentNotFoundException,
  SessionNotFoundException,
  ApiKeyRequiredException,
} from '../common/exceptions';
import { AgentRepository } from '../agent/agent.repository';
import { AgentConfigService } from '../agent/services/agent-config.service';
import { SessionRepository } from '../session/session.repository';
import { SessionService } from '../session/session.service';
import { MessageRepository } from '../message/message.repository';
import { AgentMemoryService } from '../memory/agent-memory.service';
import { ApiCredentialsService } from '../api-credentials/api-credentials.service';
import { MessageTranslationService } from '../message-translation/message-translation.service';
import { WordTranslationService } from '../message-translation/word-translation.service';
import { SavedWordService } from '../saved-word/saved-word.service';
import { MessageRole } from '../common/enums/message-role.enum';
import { AgentType } from '../common/enums/agent-type.enum';
import { MEMORY_CONFIG } from '../common/constants/api.constants.js';
import { MAGIC_STRINGS } from '../common/constants/error-messages.constants.js';
import {
  SessionResponseDto,
  ChatHistoryResponseDto,
  SendMessageResponseDto,
} from '../common/dto/chat.dto';
import { MessagePreparationService, AgentConfig } from './services/message-preparation.service';
import { OpenAIChatService } from './services/openai-chat.service';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly agentRepository: AgentRepository,
    private readonly agentConfigService: AgentConfigService,
    private readonly sessionRepository: SessionRepository,
    private readonly sessionService: SessionService,
    private readonly messageRepository: MessageRepository,
    private readonly agentMemoryService: AgentMemoryService,
    private readonly apiCredentialsService: ApiCredentialsService,
    private readonly messageTranslationService: MessageTranslationService,
    private readonly wordTranslationService: WordTranslationService,
    private readonly savedWordService: SavedWordService,
    private readonly messagePreparationService: MessagePreparationService,
    private readonly openaiChatService: OpenAIChatService
  ) {}

  async getSessions(
    agentId: number,
    userId: string
  ): Promise<SessionResponseDto[]> {
    this.logger.debug(`Getting sessions for agent ${agentId}, user ${userId}`);
    return this.sessionService.getSessions(agentId, userId);
  }

  async createSession(
    agentId: number,
    userId: string
  ): Promise<SessionResponseDto> {
    this.logger.log(`Creating session for agent ${agentId}, user ${userId}`);
    return this.sessionService.createSession(agentId, userId);
  }

  /**
   * Validate agent access and return agent with config
   */
  private async validateAgentAccess(
    agentId: number,
    userId: string
  ): Promise<{
    id: number;
    name: string;
    description: string | null;
    agentType: AgentType | null;
    language: string | null;
    configs: Record<string, unknown>;
  }> {
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

  async getChatHistory(
    agentId: number,
    userId: string,
    sessionId?: number
  ): Promise<ChatHistoryResponseDto> {
    this.logger.debug(
      `Getting chat history for agent ${agentId}, user ${userId}, sessionId: ${sessionId || 'latest'} (loading all messages)`
    );
    // Load agent with config
    const agent = await this.validateAgentAccess(agentId, userId);

    // Get session (don't create - session creation only happens in sendMessage)
    let session;
    if (sessionId) {
      session = await this.validateSessionAccess(sessionId, agentId, userId);
    } else {
      // If no sessionId provided, find latest session but don't create one
      session = await this.sessionRepository.findLatestByAgentId(
        agentId,
        userId
      );
      // If no session exists, return empty history instead of creating one
      if (!session) {
        return {
          agent: {
            id: agent.id,
            name: agent.name,
            description: agent.description,
          },
          session: null,
          messages: [],
          savedWordMatches: [],
          hasMore: false,
        };
      }
    }

    // Load all messages (no pagination) - use withRawData to get all fields
    const messageRecords = await this.messageRepository.findAllBySessionIdWithRawData(
      session.id
      // No limit - loads all messages (default limit is 1000, which should be enough)
    );

    // Get all message IDs
    const messageIds = messageRecords.map((m) => m.id);

    // Load translations for all messages
    const translations =
      await this.messageTranslationService.getTranslationsForMessages(
        messageIds
      );

    // Get word translations for assistant messages
    const assistantMessageIds = messageRecords
      .filter((m) => m.role === MessageRole.ASSISTANT)
      .map((m) => m.id);

    const wordTranslations =
      await this.wordTranslationService.getWordTranslationsForMessages(
        assistantMessageIds
      );

    // Find saved word matches for all words in assistant messages
    let savedWordMatches: Array<{
      originalWord: string;
      savedWordId: number;
      translation: string;
      pinyin: string | null;
    }> = [];
    try {
      // Extract all unique words from word translations
      const allWords = new Set<string>();
      wordTranslations.forEach((wts) => {
        wts.forEach((wt) => {
          allWords.add(wt.originalWord);
        });
      });

      if (allWords.size > 0) {
        savedWordMatches = await this.savedWordService.findMatchingWords(
          userId,
          Array.from(allWords)
        );
        this.logger.debug(
          `Found ${savedWordMatches.length} saved word matches for session ${session.id}`
        );
      }
    } catch (error) {
      this.logger.error('Error finding saved word matches:', error);
      // Continue without saved word matches
    }

    const messages = messageRecords.map(
      (msg: {
        id: number;
        role: string;
        content: string;
        rawRequest?: unknown;
        rawResponse?: unknown;
      }) => {
        const baseMessage = {
          id: msg.id,
          role: msg.role as MessageRole,
          content: msg.content,
          rawRequest: msg.rawRequest,
          rawResponse: msg.rawResponse,
          translation: translations.get(msg.id),
        };

        // Add word translations for assistant messages
        if (msg.role === MessageRole.ASSISTANT) {
          return {
            ...baseMessage,
            wordTranslations: wordTranslations.get(msg.id) || [],
          };
        }

        return baseMessage;
      }
    );

    return {
      agent: {
        id: agent.id,
        name: agent.name,
        description: agent.description,
      },
      session: {
        id: session.id,
        session_name: session.sessionName,
      },
      messages,
      savedWordMatches,
      hasMore: false, // No pagination, always false
    };
  }

  async sendMessage(
    agentId: number,
    userId: string,
    message: string,
    sessionId?: number
  ): Promise<SendMessageResponseDto> {
    this.logger.log(
      `Sending message for agent ${agentId}, user ${userId}, sessionId: ${sessionId || 'new'}`
    );

    // User is automatically synced to DB by ClerkGuard

    // Check if user has API key
    const apiKey = await this.apiCredentialsService.getApiKey(
      userId,
      MAGIC_STRINGS.OPENAI_PROVIDER
    );
    if (!apiKey) {
      this.logger.warn(`No API key found for user ${userId}`);
      throw new ApiKeyRequiredException();
    }

    // Load agent with config
    const agent = await this.validateAgentAccess(agentId, userId);
    const mergedConfig = this.agentConfigService.mergeAgentConfig(agent.configs);
    const agentConfig: AgentConfig = {
      system_prompt: mergedConfig.system_prompt as string | undefined,
      behavior_rules: mergedConfig.behavior_rules as string | undefined,
      temperature: mergedConfig.temperature as number | undefined,
      model: mergedConfig.model as string | undefined,
      max_tokens: mergedConfig.max_tokens as number | undefined,
      agentType: agent.agentType,
      language: agent.language,
    };
    this.logger.debug(`Loaded agent ${agentId} with config`);

    // Get or create session
    let session;
    if (sessionId) {
      session = await this.validateSessionAccess(sessionId, agentId, userId);
      this.logger.debug(`Using existing session ${sessionId}`);
    } else {
      session = await this.sessionRepository.findLatestByAgentId(
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
    }

    // Load existing messages
    const existingMessages =
      await this.messageRepository.findAllBySessionIdForOpenAI(session.id);
    this.logger.debug(`Loaded ${existingMessages.length} existing messages`);

    // Retrieve relevant memories using vector similarity
    let relevantMemories: string[] = [];
    try {
      relevantMemories = await this.agentMemoryService.getMemoriesForContext(
        agentId,
        userId,
        message,
        apiKey
      );
      if (relevantMemories.length > 0) {
        this.logger.log(
          `Found ${relevantMemories.length} relevant memories for agent ${agentId}`
        );
      }
    } catch (error) {
      this.logger.error('Error retrieving memories:', error);
      // Continue without memories if retrieval fails
    }

    // Prepare messages for OpenAI using MessagePreparationService
    const messagesForAPI =
      await this.messagePreparationService.prepareMessagesForOpenAI(
        existingMessages,
        agentConfig,
        message,
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
      message,
      undefined,
      openaiRequest,
      undefined
    );
    this.logger.debug(`Saved user message ${userMessage.id}`);

    // Call OpenAI API using OpenAIChatService
    const { response, completion } =
      await this.openaiChatService.createChatCompletion(apiKey, openaiRequest);
    this.logger.log(
      `Received response from OpenAI (length: ${response.length})`
    );

    // Extract words AND translations from response JSON (required in prompt)
    let extractedWords: Array<{ originalWord: string; translation: string }> = [];
    let extractedTranslation: string | undefined;
    let cleanedResponse = response;
    let translationsExtracted = false;

    try {
      // Extract JSON with translations from response
      const jsonMatch = response.match(/\n\s*\{[\s\S]*"words"[\s\S]*\}\s*$/);
      if (jsonMatch) {
        const jsonStr = jsonMatch[0].trim();
        const parsed = JSON.parse(jsonStr);

        if (parsed.words && Array.isArray(parsed.words) && parsed.fullTranslation) {
          extractedWords = parsed.words
            .filter(
              (w: any) =>
                w.originalWord &&
                w.translation &&
                typeof w.originalWord === 'string' &&
                typeof w.translation === 'string'
            )
            .map((w: any) => ({
              originalWord: w.originalWord,
              translation: w.translation,
            }));

          extractedTranslation = parsed.fullTranslation;

          // Remove JSON from response
          cleanedResponse = response.substring(
            0,
            response.length - jsonMatch[0].length
          ).trim();

          translationsExtracted = true;

          this.logger.debug(
            `Extracted ${extractedWords.length} words and translation from OpenAI response`
          );
        } else {
          this.logger.warn(
            'Response JSON missing required fields (words or fullTranslation)'
          );
        }
      } else {
        this.logger.warn('No JSON structure found in OpenAI response');
      }
    } catch (error) {
      this.logger.warn('Failed to extract translations from response JSON:', error);
      // If extraction fails, we still have the chat response
      // Message is returned without translations, user can request translation manually
      translationsExtracted = false;
    }

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

    // Save extracted translations if available
    if (translationsExtracted && extractedWords.length > 0 && extractedTranslation) {
      try {
        await this.wordTranslationService.saveExtractedTranslations(
          assistantMessage.id,
          extractedWords,
          extractedTranslation,
          cleanedResponse
        );
        this.logger.debug(
          `Saved translations for assistant message ${assistantMessage.id}`
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
            assistantMessage.id,
            extractedWords.map((w) => ({ originalWord: w.originalWord })),
            cleanedResponse
          );
          this.logger.debug(
            `Saved words without translations for assistant message ${assistantMessage.id}`
          );
        } catch (error) {
          this.logger.error('Error saving words:', error);
          // Continue without words - highlighting won't work but message still works
        }
      } else {
        // Try to parse words using OpenAI (fallback)
        try {
          await this.wordTranslationService.parseWordsInMessage(
            assistantMessage.id,
            cleanedResponse,
            apiKey
          );
          this.logger.debug(
            `Parsed words for message ${assistantMessage.id}`
          );
        } catch (error) {
          this.logger.error('Error parsing words:', error);
          // Continue without word parsing - highlighting will still work if words exist
        }
      }
    }

    // Get word translations for response (with translations if extracted)
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
            assistantMessage.id
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
          `Found ${savedWordMatches.length} saved word matches for message ${assistantMessage.id}`
        );
      }
    } catch (error) {
      this.logger.error('Error finding saved word matches:', error);
      // Continue without saved word matches
    }

    // Save memory periodically (every N messages, or on first message)
    const allMessages =
      await this.messageRepository.findAllBySessionIdForOpenAI(session.id);
    const shouldSaveMemory =
      allMessages.length === 1 || // Save on first message
      (allMessages.length > 0 &&
        allMessages.length % MEMORY_CONFIG.MEMORY_SAVE_INTERVAL === 0);

    if (shouldSaveMemory) {
      try {
        this.logger.debug(
          `Attempting to save memories for agent ${agentId}, session ${session.id} (${allMessages.length} messages, interval: ${MEMORY_CONFIG.MEMORY_SAVE_INTERVAL})`
        );

        const createdCount = await this.agentMemoryService.createMemory(
          agentId,
          userId,
          session.id,
          session.sessionName,
          allMessages,
          apiKey
        );

        if (createdCount > 0) {
          this.logger.log(
            `Successfully created ${createdCount} memories for agent ${agentId}, session ${session.id} (${allMessages.length} messages)`
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
            `No memories created for agent ${agentId}, session ${session.id} (likely no insights extracted)`
          );
        }
      } catch (error) {
        this.logger.error(
          `Error saving memories for agent ${agentId}, session ${session.id}:`,
          error
        );
        // Continue even if memory save fails
      }
    } else {
      this.logger.debug(
        `Skipping memory save for agent ${agentId}, session ${session.id} (${allMessages.length} messages, not at interval)`
      );
    }

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
      translation: translationsExtracted ? extractedTranslation : undefined,
      wordTranslations:
        translationsExtracted && parsedWordTranslations.length > 0
          ? parsedWordTranslations
          : parsedWordTranslations.length > 0
            ? parsedWordTranslations
            : undefined,
      savedWordMatches: savedWordMatches.length > 0 ? savedWordMatches : undefined,
    };
  }

  async updateSession(
    agentId: number,
    sessionId: number,
    userId: string,
    sessionName?: string
  ): Promise<SessionResponseDto> {
    this.logger.log(
      `Updating session ${sessionId} for agent ${agentId}, user ${userId}`
    );
    return this.sessionService.updateSession(
      agentId,
      sessionId,
      userId,
      sessionName
    );
  }

  async deleteSession(
    agentId: number,
    sessionId: number,
    userId: string
  ): Promise<void> {
    this.logger.log(
      `Deleting session ${sessionId} for agent ${agentId}, user ${userId}`
    );
    return this.sessionService.deleteSession(agentId, sessionId, userId);
  }
}
