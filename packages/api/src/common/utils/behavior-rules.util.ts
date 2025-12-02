/**
 * Utility functions for parsing and formatting behavior rules
 * Centralized to avoid duplication
 */

export class BehaviorRulesUtil {
  /**
   * Parse behavior rules from various formats (JSON string, array, object)
   */
  static parse(behaviorRules: unknown): string[] {
    if (!behaviorRules) return [];

    try {
      if (typeof behaviorRules === 'string') {
        try {
          const parsed = JSON.parse(behaviorRules);
          if (Array.isArray(parsed)) {
            return parsed.map((r) => String(r));
          } else if (
            typeof parsed === 'object' &&
            parsed !== null &&
            'rules' in parsed &&
            Array.isArray((parsed as { rules: unknown }).rules)
          ) {
            return (parsed as { rules: unknown[] }).rules.map((r: unknown) => String(r));
          } else {
            return [String(parsed)];
          }
        } catch {
          return [behaviorRules];
        }
      } else if (Array.isArray(behaviorRules)) {
        return behaviorRules.map((r: unknown) => String(r));
      } else if (
        typeof behaviorRules === 'object' &&
        behaviorRules !== null &&
        'rules' in behaviorRules &&
        Array.isArray((behaviorRules as { rules: unknown }).rules)
      ) {
        const rulesObj = behaviorRules as { rules: unknown[] };
        return rulesObj.rules.map((r: unknown) => String(r));
      } else {
        return [String(behaviorRules)];
      }
    } catch (error) {
      console.error('Error parsing behavior rules:', error);
      return [];
    }
  }

  /**
   * Format behavior rules as numbered list text
   */
  static format(rules: string[]): string {
    return rules
      .filter((rule) => rule.trim().length > 0)
      .map((rule, index) => `${index + 1}. ${rule.trim()}`)
      .join('\n');
  }

  /**
   * Format system behavior rules message
   */
  static formatSystemRules(rules: string[]): string {
    const formatted = this.format(rules);
    return formatted.length > 0 ? `System Behavior Rules (Required):\n${formatted}` : '';
  }

  /**
   * Format bot behavior rules message
   */
  static formatBotRules(rules: string[]): string {
    const formatted = this.format(rules);
    return formatted.length > 0 ? `Behavior Rules:\n${formatted}` : '';
  }
}

