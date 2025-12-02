import { describe, it, expect } from 'vitest';
import { parseBehaviorRules } from './agent.utils';

describe('parseBehaviorRules', () => {
  describe('when behavior_rules is null or undefined', () => {
    it('should return empty array for null', () => {
      expect(parseBehaviorRules(null)).toEqual([]);
    });

    it('should return empty array for undefined', () => {
      expect(parseBehaviorRules(undefined)).toEqual([]);
    });
  });

  describe('when behavior_rules is a string', () => {
    it('should parse JSON array string', () => {
      const input = '["Rule 1", "Rule 2", "Rule 3"]';
      expect(parseBehaviorRules(input)).toEqual(['Rule 1', 'Rule 2', 'Rule 3']);
    });

    it('should parse JSON object with rules array', () => {
      const input = '{"rules": ["Rule 1", "Rule 2"]}';
      expect(parseBehaviorRules(input)).toEqual(['Rule 1', 'Rule 2']);
    });

    it('should return single-item array for non-array JSON', () => {
      const input = '"Single rule"';
      expect(parseBehaviorRules(input)).toEqual(['Single rule']);
    });

    it('should return single-item array for invalid JSON string', () => {
      const input = 'Not valid JSON';
      expect(parseBehaviorRules(input)).toEqual(['Not valid JSON']);
    });

    it('should handle empty JSON array', () => {
      const input = '[]';
      expect(parseBehaviorRules(input)).toEqual([]);
    });
  });

  describe('when behavior_rules is an array', () => {
    it('should convert array of strings', () => {
      const input = ['Rule 1', 'Rule 2', 'Rule 3'];
      expect(parseBehaviorRules(input)).toEqual(['Rule 1', 'Rule 2', 'Rule 3']);
    });

    it('should convert array of numbers to strings', () => {
      const input = [1, 2, 3];
      expect(parseBehaviorRules(input)).toEqual(['1', '2', '3']);
    });

    it('should convert array of mixed types to strings', () => {
      const input = ['Rule 1', 2, true, null];
      expect(parseBehaviorRules(input)).toEqual(['Rule 1', '2', 'true', 'null']);
    });

    it('should handle empty array', () => {
      expect(parseBehaviorRules([])).toEqual([]);
    });
  });

  describe('when behavior_rules is an object', () => {
    it('should extract rules array from object', () => {
      const input = { rules: ['Rule 1', 'Rule 2'] };
      expect(parseBehaviorRules(input)).toEqual(['Rule 1', 'Rule 2']);
    });

    it('should convert rules array items to strings', () => {
      const input = { rules: [1, 2, 3] };
      expect(parseBehaviorRules(input)).toEqual(['1', '2', '3']);
    });

    it('should return single-item array for object without rules property', () => {
      const input = { other: 'value' };
      expect(parseBehaviorRules(input)).toEqual(['[object Object]']);
    });
  });

  describe('when behavior_rules is a primitive', () => {
    it('should convert number to string array', () => {
      expect(parseBehaviorRules(123)).toEqual(['123']);
    });

    it('should convert boolean to string array', () => {
      expect(parseBehaviorRules(true)).toEqual(['true']);
      expect(parseBehaviorRules(false)).toEqual(['false']);
    });
  });
});
