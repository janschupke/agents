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
  { value: Language.CHINESE_SIMPLIFIED, labelKey: 'config.language.chineseSimplified' },
  { value: Language.CHINESE_TRADITIONAL, labelKey: 'config.language.chineseTraditional' },
  { value: Language.JAPANESE, labelKey: 'config.language.japanese' },
  { value: Language.KOREAN, labelKey: 'config.language.korean' },
  { value: Language.SPANISH, labelKey: 'config.language.spanish' },
  { value: Language.FRENCH, labelKey: 'config.language.french' },
  { value: Language.GERMAN, labelKey: 'config.language.german' },
  { value: Language.ITALIAN, labelKey: 'config.language.italian' },
  { value: Language.PORTUGUESE, labelKey: 'config.language.portuguese' },
  { value: Language.RUSSIAN, labelKey: 'config.language.russian' },
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
