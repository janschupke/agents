import { describe, it, expect, vi } from 'vitest';
import { Language } from '@openai/shared-types';
import { LANGUAGE_OPTIONS, getLanguageOptions } from './language.constants';

describe('language.constants (admin)', () => {
  describe('LANGUAGE_OPTIONS', () => {
    it('should contain all expected language options', () => {
      expect(LANGUAGE_OPTIONS).toHaveLength(10);
      
      const values = LANGUAGE_OPTIONS.map((opt) => opt.value);
      expect(values).toContain(Language.CHINESE_SIMPLIFIED);
      expect(values).toContain(Language.CHINESE_TRADITIONAL);
      expect(values).toContain(Language.JAPANESE);
      expect(values).toContain(Language.KOREAN);
      expect(values).toContain(Language.SPANISH);
      expect(values).toContain(Language.FRENCH);
      expect(values).toContain(Language.GERMAN);
      expect(values).toContain(Language.ITALIAN);
      expect(values).toContain(Language.PORTUGUESE);
      expect(values).toContain(Language.RUSSIAN);
    });

    it('should have labelKey for each option with admin namespace', () => {
      LANGUAGE_OPTIONS.forEach((option) => {
        expect(option.labelKey).toBeTruthy();
        expect(typeof option.labelKey).toBe('string');
        expect(option.labelKey).toMatch(/^archetypes\.form\.language/);
      });
    });

    it('should use Language enum values', () => {
      LANGUAGE_OPTIONS.forEach((option) => {
        expect(Object.values(Language)).toContain(option.value);
      });
    });
  });

  describe('getLanguageOptions', () => {
    it('should return options with translated labels', () => {
      const mockT = vi.fn((key: string) => `translated:${key}`);
      const result = getLanguageOptions(mockT);

      expect(result).toHaveLength(10);
      expect(mockT).toHaveBeenCalledTimes(10);
      
      result.forEach((option, index) => {
        expect(option.value).toBe(LANGUAGE_OPTIONS[index].value);
        expect(option.label).toBe(`translated:${LANGUAGE_OPTIONS[index].labelKey}`);
      });
    });

    it('should call translation function with correct keys', () => {
      const mockT = vi.fn((key: string) => key);
      getLanguageOptions(mockT);

      LANGUAGE_OPTIONS.forEach((option) => {
        expect(mockT).toHaveBeenCalledWith(option.labelKey);
      });
    });

    it('should return correct structure', () => {
      const mockT = vi.fn((key: string) => key);
      const result = getLanguageOptions(mockT);

      result.forEach((option) => {
        expect(option).toHaveProperty('value');
        expect(option).toHaveProperty('label');
        expect(typeof option.value).toBe('string');
        expect(typeof option.label).toBe('string');
      });
    });
  });
});
