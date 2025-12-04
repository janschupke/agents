import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { OpenAIService } from '../openai/openai.service';
import {
  MessageWordTranslationRepository,
  WordTranslation,
} from './message-word-translation.repository';
import { MessageTranslationRepository } from './message-translation.repository';
import { OPENAI_PROMPTS } from '../common/constants/openai-prompts.constants.js';
import { NUMERIC_CONSTANTS } from '../common/constants/numeric.constants.js';
import { OPENAI_MODELS } from '../common/constants/api.constants.js';

@Injectable()
export class WordTranslationService {
  constructor(
    private readonly wordTranslationRepository: MessageWordTranslationRepository,
    private readonly openaiService: OpenAIService,
    private readonly translationRepository: MessageTranslationRepository
  ) {}

  /**
   * Save pre-parsed words directly (from OpenAI response or other source)
   */
  async saveParsedWords(
    messageId: number,
    words: Array<{ originalWord: string }>,
    messageContent: string
  ): Promise<void> {
    // Check if words already exist
    const exists =
      await this.wordTranslationRepository.existsForMessage(messageId);
    if (exists) {
      return; // Already parsed
    }

    // Split message into sentences for context
    const sentences = this.splitIntoSentences(messageContent);

    // Create a map of word -> sentence for populating sentenceContext
    const wordToSentenceMap = new Map<string, string>();
    words.forEach((w) => {
      const sentence = sentences.find((s) => s.includes(w.originalWord));
      if (sentence) {
        wordToSentenceMap.set(w.originalWord, sentence.trim());
      }
    });

    // Save to database with empty translations (will be filled when translation is requested)
    await this.wordTranslationRepository.createMany(
      messageId,
      words.map((w) => ({
        originalWord: w.originalWord,
        translation: '', // Empty translation, will be filled later
      })),
      wordToSentenceMap
    );
  }

  /**
   * Save extracted translations from OpenAI response JSON
   * Includes both word translations and full translation
   */
  async saveExtractedTranslations(
    messageId: number,
    words: Array<{ originalWord: string; translation: string }>,
    fullTranslation: string,
    messageContent: string
  ): Promise<void> {
    // Split message into sentences for context
    const sentences = this.splitIntoSentences(messageContent);

    // Create a map of word -> sentence for populating sentenceContext
    const wordToSentenceMap = new Map<string, string>();
    words.forEach((w) => {
      const sentence = sentences.find((s) => s.includes(w.originalWord));
      if (sentence) {
        wordToSentenceMap.set(w.originalWord, sentence.trim());
      }
    });

    // Delete existing translations if any
    await this.wordTranslationRepository.deleteByMessageId(messageId);

    // Save word translations with translations
    await this.wordTranslationRepository.createMany(
      messageId,
      words.map((w) => ({
        originalWord: w.originalWord,
        translation: w.translation,
        sentenceContext: wordToSentenceMap.get(w.originalWord),
      })),
      wordToSentenceMap
    );

    // Save full translation
    const existing =
      await this.translationRepository.findByMessageId(messageId);
    if (!existing) {
      await this.translationRepository.create(messageId, fullTranslation);
    } else {
      // Update existing translation
      await this.translationRepository.update(messageId, fullTranslation);
    }
  }

  /**
   * Parse words from message content (without translation)
   * This is called immediately after receiving a response to enable highlighting
   * Uses OpenAI to parse words, especially for languages without spaces (e.g., Chinese)
   */
  async parseWordsInMessage(
    messageId: number,
    messageContent: string,
    apiKey: string
  ): Promise<void> {
    // Check if words already exist
    const exists =
      await this.wordTranslationRepository.existsForMessage(messageId);
    if (exists) {
      return; // Already parsed
    }

    // Split message into sentences for context
    const sentences = this.splitIntoSentences(messageContent);

    // Use OpenAI to parse words (without translation)
    const wordTranslations = await this.parseWordsWithOpenAI(
      messageContent,
      sentences,
      apiKey
    );

    // Create a map of word -> sentence for populating sentenceContext
    const wordToSentenceMap = this.createWordToSentenceMap(
      messageContent,
      sentences,
      wordTranslations
    );

    // Save to database with empty translations (will be filled when translation is requested)
    await this.wordTranslationRepository.createMany(
      messageId,
      wordTranslations.map((wt) => ({
        ...wt,
        translation: '', // Empty translation, will be filled later
      })),
      wordToSentenceMap
    );
  }

  /**
   * Analyze message and create word-level translations
   * Uses pre-parsed words if available, otherwise parses and translates
   */
  async translateWordsInMessage(
    messageId: number,
    messageContent: string,
    apiKey: string
  ): Promise<void> {
    // Check if translations already exist with actual translations
    const existingWords =
      await this.wordTranslationRepository.findByMessageId(messageId);
    const hasTranslations = existingWords.some((w) => w.translation.trim() !== '');

    if (hasTranslations) {
      return; // Already translated
    }

    // If words exist but without translations, use them
    if (existingWords.length > 0) {
      // Translate only the pre-parsed words
      const sentences = this.splitIntoSentences(messageContent);
      const { wordTranslations, fullTranslation } =
        await this.translatePreParsedWordsWithOpenAI(
          existingWords.map((w) => w.originalWord),
          messageContent,
          sentences,
          apiKey
        );

      // Update existing words with translations
      // Delete old entries and create new ones with translations
      await this.wordTranslationRepository.deleteByMessageId(messageId);
      const wordToSentenceMap = this.createWordToSentenceMap(
        messageContent,
        sentences,
        wordTranslations
      );
      await this.wordTranslationRepository.createMany(
        messageId,
        wordTranslations,
        wordToSentenceMap
      );

      // Save full message translation
      if (fullTranslation) {
        const existing =
          await this.translationRepository.findByMessageId(messageId);
        if (!existing) {
          await this.translationRepository.create(messageId, fullTranslation);
        }
      } else {
        await this.createFullTranslationFromWords(messageId, wordTranslations);
      }
      return;
    }

    // No pre-parsed words exist, do full parse + translate
    const sentences = this.splitIntoSentences(messageContent);
    const { wordTranslations, fullTranslation } =
      await this.translateWordsWithOpenAI(messageContent, sentences, apiKey);

    const wordToSentenceMap = this.createWordToSentenceMap(
      messageContent,
      sentences,
      wordTranslations
    );

    await this.wordTranslationRepository.createMany(
      messageId,
      wordTranslations,
      wordToSentenceMap
    );

    if (fullTranslation) {
      const existing =
        await this.translationRepository.findByMessageId(messageId);
      if (!existing) {
        await this.translationRepository.create(messageId, fullTranslation);
      }
    } else {
      await this.createFullTranslationFromWords(messageId, wordTranslations);
    }
  }

  /**
   * Create full message translation from word translations
   */
  private async createFullTranslationFromWords(
    messageId: number,
    wordTranslations: WordTranslation[]
  ): Promise<void> {
    // Check if translation already exists
    const existing =
      await this.translationRepository.findByMessageId(messageId);
    if (existing) {
      return; // Already has translation
    }

    // Derive full translation by joining word translations with spaces
    // This preserves the order and creates a readable full translation
    const fullTranslation = wordTranslations
      .map((wt) => wt.translation)
      .join(' ');

    // Save the derived full translation
    await this.translationRepository.create(messageId, fullTranslation);
  }

  /**
   * Split message into sentences for context
   */
  private splitIntoSentences(text: string): string[] {
    // Split by sentence-ending punctuation, but keep the punctuation
    // This handles various languages and punctuation marks
    return text
      .split(/([.!?。！？]+[\s\n]*)/)
      .filter((s) => s.trim().length > 0);
  }

  /**
   * Create a map of words to their containing sentences
   */
  private createWordToSentenceMap(
    _messageContent: string,
    sentences: string[],
    wordTranslations: WordTranslation[]
  ): Map<string, string> {
    const wordToSentence = new Map<string, string>();

    // For each word, find which sentence it belongs to
    wordTranslations.forEach((wt) => {
      if (!wordToSentence.has(wt.originalWord)) {
        // Find the sentence containing this word
        const containingSentence = sentences.find((sentence) =>
          sentence.includes(wt.originalWord)
        );
        if (containingSentence) {
          wordToSentence.set(wt.originalWord, containingSentence.trim());
        }
      }
    });

    return wordToSentence;
  }

  /**
   * Parse words from message using OpenAI (without translation)
   * Returns words with empty translations
   */
  private async parseWordsWithOpenAI(
    messageContent: string,
    _sentences: string[],
    apiKey: string
  ): Promise<WordTranslation[]> {
    const openai = this.openaiService.getClient(apiKey);

    const prompt = `Analyze the following text and identify all words/tokens, especially for languages without spaces (like Chinese, Japanese, etc.).

Text:
${messageContent}

For each word or token, provide:
1. The original word/token as it appears in the text

Return a JSON object with:
- "words": array where each element has:
  - "originalWord": string (the word/token as it appears in the text)

Example format:
{
  "words": [
    {"originalWord": "你好"},
    {"originalWord": "世界"},
    ...
  ]
}

Return ONLY the JSON object, no additional text.`;

    try {
      const completion = await openai.chat.completions.create({
        model: OPENAI_MODELS.TRANSLATION,
        messages: [
          {
            role: 'system',
            content: 'You are a word parsing assistant. Return only valid JSON objects.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: NUMERIC_CONSTANTS.TRANSLATION_TEMPERATURE,
        response_format: { type: 'json_object' },
      });

      const response = completion.choices[0]?.message?.content?.trim();
      if (!response) {
        // Fallback: return empty array if parsing fails
        return [];
      }

      let parsed: { words?: Array<{ originalWord?: string }> };
      try {
        parsed = JSON.parse(response);
      } catch (e) {
        return [];
      }

      const words = (parsed.words || [])
        .filter((w) => w.originalWord && w.originalWord.trim().length > 0)
        .map((w) => ({
          originalWord: w.originalWord!,
          translation: '', // Empty, will be filled when translation is requested
        }));

      return words;
    } catch (error) {
      // Return empty array on error - parsing is optional
      return [];
    }
  }

  /**
   * Translate pre-parsed words using OpenAI
   * Only requests translation, not word splitting
   */
  private async translatePreParsedWordsWithOpenAI(
    words: string[],
    messageContent: string,
    _sentences: string[],
    apiKey: string
  ): Promise<{
    wordTranslations: WordTranslation[];
    fullTranslation: string | null;
  }> {
    const openai = this.openaiService.getClient(apiKey);

    const prompt = `You are a professional translator. Translate the following pre-parsed words to English, considering the sentence context.

Text:
${messageContent}

Words to translate:
${words.map((w, i) => `${i + 1}. ${w}`).join('\n')}

For each word, provide:
1. The original word/token as provided
2. Its English translation considering the sentence context

Also provide the full sentence translation in natural, fluent English.

Return a JSON object with:
- "fullTranslation": string (the complete message translated into natural, fluent English)
- "words": array where each element has:
  - "originalWord": string (the word/token as provided)
  - "translation": string (English translation of the word in context)

Return ONLY the JSON object, no additional text.`;

    try {
      const completion = await openai.chat.completions.create({
        model: OPENAI_MODELS.TRANSLATION,
        messages: [
          {
            role: 'system',
            content: OPENAI_PROMPTS.WORD_TRANSLATION.SYSTEM,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: NUMERIC_CONSTANTS.TRANSLATION_TEMPERATURE,
        response_format: { type: 'json_object' },
      });

      const response = completion.choices[0]?.message?.content?.trim();
      if (!response) {
        throw new HttpException(
          'Word translation failed: No response',
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }

      let parsed: { words?: WordTranslation[]; fullTranslation?: string };
      try {
        parsed = JSON.parse(response);
      } catch (e) {
        throw new HttpException(
          'Word translation failed: Invalid JSON',
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }

      const translations = parsed.words || [];
      const fullTranslation = parsed.fullTranslation;

      interface WordTranslationItem {
        originalWord?: string;
        translation?: string;
      }
      const wordTranslations = (translations as WordTranslationItem[])
        .filter((wt) => wt.originalWord && wt.translation)
        .map((wt) => ({
          originalWord: wt.originalWord!,
          translation: wt.translation!,
        }));

      return {
        wordTranslations,
        fullTranslation: fullTranslation || null,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Word translation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Translate words using OpenAI - let OpenAI handle word/token splitting
   * Returns both word translations and full sentence translation
   */
  private async translateWordsWithOpenAI(
    messageContent: string,
    _sentences: string[],
    apiKey: string
  ): Promise<{
    wordTranslations: WordTranslation[];
    fullTranslation: string | null;
  }> {
    const openai = this.openaiService.getClient(apiKey);

    const prompt = OPENAI_PROMPTS.WORD_TRANSLATION.USER(messageContent);

    try {
      const completion = await openai.chat.completions.create({
        model: OPENAI_MODELS.TRANSLATION,
        messages: [
          {
            role: 'system',
            content: OPENAI_PROMPTS.WORD_TRANSLATION.SYSTEM,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: NUMERIC_CONSTANTS.TRANSLATION_TEMPERATURE,
        response_format: { type: 'json_object' },
      });

      const response = completion.choices[0]?.message?.content?.trim();
      if (!response) {
        throw new HttpException(
          'Word translation failed: No response',
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }

      // Parse JSON response
      let parsed: { words?: WordTranslation[]; fullTranslation?: string };
      try {
        parsed = JSON.parse(response);
      } catch (e) {
        throw new HttpException(
          'Word translation failed: Invalid JSON',
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }

      const translations = parsed.words || [];
      const fullTranslation = parsed.fullTranslation;

      // Validate and map to our format
      interface WordTranslationItem {
        originalWord?: string;
        translation?: string;
      }
      const wordTranslations = (translations as WordTranslationItem[])
        .filter((wt) => wt.originalWord && wt.translation)
        .map((wt) => ({
          originalWord: wt.originalWord!,
          translation: wt.translation!,
        }));

      return {
        wordTranslations,
        fullTranslation: fullTranslation || null,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Word translation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get word translations for a message
   * Returns words even if they don't have translations yet (for highlighting)
   */
  async getWordTranslationsForMessage(
    messageId: number
  ): Promise<WordTranslation[]> {
    const translations =
      await this.wordTranslationRepository.findByMessageId(messageId);
    return translations.map((t) => ({
      originalWord: t.originalWord,
      translation: t.translation || '', // Return empty string if no translation yet
      sentenceContext: t.sentenceContext ?? undefined,
    }));
  }

  /**
   * Get word translations for multiple messages
   */
  async getWordTranslationsForMessages(
    messageIds: number[]
  ): Promise<Map<number, WordTranslation[]>> {
    const translations =
      await this.wordTranslationRepository.findByMessageIds(messageIds);

    const translationMap = new Map<number, WordTranslation[]>();

    translations.forEach((t) => {
      if (!translationMap.has(t.messageId)) {
        translationMap.set(t.messageId, []);
      }
      translationMap.get(t.messageId)!.push({
        originalWord: t.originalWord,
        translation: t.translation,
        sentenceContext: t.sentenceContext ?? undefined,
      });
    });

    return translationMap;
  }
}
