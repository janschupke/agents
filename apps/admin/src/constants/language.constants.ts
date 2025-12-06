import { Language } from '@openai/shared-types';

interface LanguageOption {
  value: Language;
  labelKey: string;
}

/**
 * Language options with translation keys
 * Use getLanguageOptions(t) to get translated labels
 */
export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { value: Language.CHINESE_SIMPLIFIED, labelKey: 'archetypes.form.languageChineseSimplified' },
  { value: Language.CHINESE_TRADITIONAL, labelKey: 'archetypes.form.languageChineseTraditional' },
  { value: Language.JAPANESE, labelKey: 'archetypes.form.languageJapanese' },
  { value: Language.KOREAN, labelKey: 'archetypes.form.languageKorean' },
  { value: Language.SPANISH, labelKey: 'archetypes.form.languageSpanish' },
  { value: Language.FRENCH, labelKey: 'archetypes.form.languageFrench' },
  { value: Language.GERMAN, labelKey: 'archetypes.form.languageGerman' },
  { value: Language.ITALIAN, labelKey: 'archetypes.form.languageItalian' },
  { value: Language.PORTUGUESE, labelKey: 'archetypes.form.languagePortuguese' },
  { value: Language.RUSSIAN, labelKey: 'archetypes.form.languageRussian' },
] as const;

/**
 * Get language options with translated labels
 * @param t - Translation function from useTranslation hook
 */
export function getLanguageOptions(t: (key: string) => string): Array<{ value: Language; label: string }> {
  return LANGUAGE_OPTIONS.map((option) => ({
    value: option.value,
    label: t(option.labelKey),
  }));
}
