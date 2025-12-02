/**
 * Parses behavior rules from various formats into a string array
 */
export function parseBehaviorRules(behavior_rules: unknown): string[] {
  if (!behavior_rules) return [];

  if (typeof behavior_rules === 'string') {
    try {
      const parsed = JSON.parse(behavior_rules);
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
      return [behavior_rules];
    }
  } else if (Array.isArray(behavior_rules)) {
    return behavior_rules.map((r: unknown) => String(r));
  } else if (
    typeof behavior_rules === 'object' &&
    behavior_rules !== null &&
    'rules' in behavior_rules &&
    Array.isArray((behavior_rules as { rules: unknown }).rules)
  ) {
    const rulesObj = behavior_rules as { rules: unknown[] };
    return rulesObj.rules.map((r: unknown) => String(r));
  } else {
    return [String(behavior_rules)];
  }
}
