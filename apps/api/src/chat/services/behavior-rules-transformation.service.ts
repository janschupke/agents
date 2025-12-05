import { Injectable, Logger } from '@nestjs/common';
import { MessageRole } from '../../common/enums/message-role.enum';

export interface RulesTransformOptions {
  role?: MessageRole; // 'system' | 'user' - affects formatting
  header?: string; // Optional header text
  format?: 'numbered' | 'bulleted' | 'plain'; // Default: 'numbered'
  separator?: string; // Default: '\n'
}

@Injectable()
export class BehaviorRulesTransformationService {
  private readonly logger = new Logger(
    BehaviorRulesTransformationService.name
  );

  /**
   * Transform array of behavior rules into a single message content
   * @param rules Array of rule strings
   * @param options Transformation options
   * @returns Formatted message content
   */
  transformRulesToMessage(
    rules: string[],
    options?: RulesTransformOptions
  ): string {
    if (!rules || rules.length === 0) {
      this.logger.debug('No rules to transform');
      return '';
    }

    const format = options?.format ?? 'numbered';
    const separator = options?.separator ?? '\n';
    const header = options?.header;

    // Filter out empty rules
    const validRules = rules.filter(
      (rule) => rule && rule.trim().length > 0
    );

    if (validRules.length === 0) {
      return '';
    }

    let formattedRules: string;

    switch (format) {
      case 'numbered':
        formattedRules = validRules
          .map((rule, index) => `${index + 1}. ${rule.trim()}`)
          .join(separator);
        break;
      case 'bulleted':
        formattedRules = validRules
          .map((rule) => `- ${rule.trim()}`)
          .join(separator);
        break;
      case 'plain':
        formattedRules = validRules.map((rule) => rule.trim()).join(separator);
        break;
      default:
        formattedRules = validRules
          .map((rule, index) => `${index + 1}. ${rule.trim()}`)
          .join(separator);
    }

    if (header) {
      return `${header}\n${formattedRules}`;
    }

    this.logger.debug(`Transformed ${validRules.length} rules to message`);
    return formattedRules;
  }

  /**
   * Merge multiple rule arrays and transform to single message
   * @param ruleArrays Array of rule arrays to merge
   * @param options Transformation options
   * @returns Formatted message content
   */
  mergeAndTransformRules(
    ruleArrays: string[][],
    options?: RulesTransformOptions
  ): string {
    if (!ruleArrays || ruleArrays.length === 0) {
      this.logger.debug('No rule arrays to merge');
      return '';
    }

    // Flatten all rules into a single array
    const allRules = ruleArrays.flat().filter(
      (rule) => rule && rule.trim().length > 0
    );

    if (allRules.length === 0) {
      return '';
    }

    // Remove duplicates (case-insensitive)
    const uniqueRules = Array.from(
      new Map(
        allRules.map((rule) => [rule.trim().toLowerCase(), rule.trim()])
      ).values()
    );

    this.logger.debug(
      `Merged ${ruleArrays.length} rule arrays into ${uniqueRules.length} unique rules`
    );

    return this.transformRulesToMessage(uniqueRules, options);
  }
}
