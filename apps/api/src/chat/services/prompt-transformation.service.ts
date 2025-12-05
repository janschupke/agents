import { Injectable, Logger } from '@nestjs/common';

export interface PromptMergeOptions {
  separator?: string; // Default: '\n\n---\n\n'
  embedTimeAt?: 'start' | 'end'; // Default: 'start'
  timeFormat?: 'iso' | 'readable'; // Default: 'iso'
}

@Injectable()
export class PromptTransformationService {
  private readonly logger = new Logger(PromptTransformationService.name);

  /**
   * Merge multiple system prompts into a single prompt
   * @param prompts Array of prompts to merge (in order of priority)
   * @param options Transformation options
   * @returns Merged prompt string
   */
  mergeSystemPrompts(
    prompts: Array<string | null | undefined>,
    options?: PromptMergeOptions
  ): string {
    const separator = options?.separator ?? '\n\n---\n\n';
    const validPrompts = prompts.filter(
      (prompt): prompt is string =>
        prompt !== null && prompt !== undefined && prompt.trim().length > 0
    );

    if (validPrompts.length === 0) {
      this.logger.debug('No valid prompts to merge');
      return '';
    }

    if (validPrompts.length === 1) {
      return validPrompts[0].trim();
    }

    const merged = validPrompts.map((p) => p.trim()).join(separator);
    this.logger.debug(`Merged ${validPrompts.length} system prompts`);
    return merged;
  }

  /**
   * Embed current time into system prompt
   * @param prompt System prompt
   * @param currentDateTime Current date/time
   * @param options Transformation options
   * @returns Prompt with embedded current time
   */
  embedCurrentTime(
    prompt: string,
    currentDateTime: Date,
    options?: PromptMergeOptions
  ): string {
    if (!prompt || prompt.trim().length === 0) {
      this.logger.debug('Empty prompt, skipping time embedding');
      return prompt;
    }

    const embedAt = options?.embedTimeAt ?? 'start';
    const timeFormat = options?.timeFormat ?? 'iso';

    let timeString: string;
    if (timeFormat === 'iso') {
      timeString = currentDateTime.toISOString();
    } else {
      timeString = currentDateTime.toLocaleString('en-US', {
        dateStyle: 'full',
        timeStyle: 'long',
      });
    }

    const timePrefix = `Current time: ${timeString}`;

    if (embedAt === 'start') {
      return `${timePrefix}\n\n${prompt.trim()}`;
    } else {
      return `${prompt.trim()}\n\n${timePrefix}`;
    }
  }
}
