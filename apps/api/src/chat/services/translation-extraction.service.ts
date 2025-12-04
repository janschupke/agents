import { Injectable, Logger } from '@nestjs/common';

/**
 * Service responsible for extracting translations from OpenAI responses
 * Handles JSON parsing and extraction of word translations and full translations
 */
@Injectable()
export class TranslationExtractionService {
  private readonly logger = new Logger(TranslationExtractionService.name);

  /**
   * Extract words and translations from OpenAI response JSON
   * Looks for JSON structure at the end of the response containing words and fullTranslation
   */
  extractTranslationsFromResponse(response: string): {
    words: Array<{ originalWord: string; translation: string }>;
    fullTranslation: string | undefined;
    cleanedResponse: string;
    extracted: boolean;
  } {
    let extractedWords: Array<{ originalWord: string; translation: string }> =
      [];
    let extractedTranslation: string | undefined;
    let cleanedResponse = response;
    let translationsExtracted = false;

    try {
      // Extract JSON with translations from response
      const jsonMatch = response.match(/\n\s*\{[\s\S]*"words"[\s\S]*\}\s*$/);
      if (jsonMatch) {
        const jsonStr = jsonMatch[0].trim();
        const parsed = JSON.parse(jsonStr);

        if (
          parsed.words &&
          Array.isArray(parsed.words) &&
          parsed.fullTranslation
        ) {
          extractedWords = parsed.words
            .filter(
              (w: { originalWord?: unknown; translation?: unknown }) =>
                w.originalWord &&
                w.translation &&
                typeof w.originalWord === 'string' &&
                typeof w.translation === 'string'
            )
            .map((w: { originalWord: string; translation: string }) => ({
              originalWord: w.originalWord,
              translation: w.translation,
            }));

          extractedTranslation = parsed.fullTranslation;

          // Remove JSON from response
          cleanedResponse = response
            .substring(0, response.length - jsonMatch[0].length)
            .trim();

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
      this.logger.warn(
        'Failed to extract translations from response JSON:',
        error
      );
      // If extraction fails, we still have the chat response
      // Message is returned without translations, user can request translation manually
      translationsExtracted = false;
    }

    return {
      words: extractedWords,
      fullTranslation: extractedTranslation,
      cleanedResponse,
      extracted: translationsExtracted,
    };
  }
}
