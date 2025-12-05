import { Injectable } from '@nestjs/common';
import { OpenAIService } from '../../openai/openai.service';
import { OPENAI_MODELS } from '../../common/constants/api.constants.js';
import { NUMERIC_CONSTANTS } from '../../common/constants/numeric.constants.js';
import { OPENAI_PROMPTS } from '../../common/constants/openai-prompts.constants.js';
import { WordTranslation } from '../message-word-translation.repository';
import { MessageRole, messageRoleToOpenAI } from '@openai/shared-types';

/**
 * Service responsible for parsing words from messages
 * Handles word/token extraction, especially for languages without spaces
 */
@Injectable()
export class WordParsingService {
  constructor(private readonly openaiService: OpenAIService) {}

  /**
   * Split message into sentences for context
   */
  splitIntoSentences(text: string): string[] {
    // Split by sentence-ending punctuation, but keep the punctuation
    // This handles various languages and punctuation marks
    return text
      .split(/([.!?。！？]+[\s\n]*)/)
      .filter((s) => s.trim().length > 0);
  }

  /**
   * Create a map of words to their containing sentences
   */
  createWordToSentenceMap(
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
  async parseWordsWithOpenAI(
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
            role: messageRoleToOpenAI(MessageRole.SYSTEM),
            content: OPENAI_PROMPTS.WORD_PARSING.SYSTEM,
          },
          {
            role: messageRoleToOpenAI(MessageRole.USER),
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
}
