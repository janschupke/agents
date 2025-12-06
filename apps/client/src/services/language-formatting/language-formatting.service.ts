import { Language } from '@openai/shared-types';

interface LanguageFormattingConfig {
  showPinyin: boolean;
  showFurigana?: boolean; // For Japanese (future)
  showRomanization?: boolean; // For Korean (future)
  // Extensible for future formatting options
}

export class LanguageFormattingService {
  /**
   * Get formatting configuration for a language
   * Accepts language names (from Language enum) or legacy language codes
   */
  static getFormattingConfig(
    language: string | null
  ): LanguageFormattingConfig {
    if (!language) {
      return { showPinyin: false };
    }

    // Chinese variants (by name)
    if (
      language === Language.CHINESE_SIMPLIFIED ||
      language === Language.CHINESE_TRADITIONAL ||
      language === 'Chinese' ||
      language === 'Chinese (Traditional)'
    ) {
      return { showPinyin: true };
    }

    // Legacy support: language codes starting with 'zh'
    if (language.startsWith('zh')) {
      return { showPinyin: true };
    }

    // Japanese (by name)
    if (language === Language.JAPANESE || language === 'Japanese') {
      return { showPinyin: false, showFurigana: true };
    }

    // Legacy support: 'ja' code
    if (language === 'ja') {
      return { showPinyin: false, showFurigana: true };
    }

    // Korean (by name)
    if (language === Language.KOREAN || language === 'Korean') {
      return { showPinyin: false, showRomanization: true };
    }

    // Legacy support: 'ko' code
    if (language === 'ko') {
      return { showPinyin: false, showRomanization: true };
    }

    // Default: no special formatting
    return { showPinyin: false };
  }

  /**
   * Check if pinyin should be shown for a language
   */
  static shouldShowPinyin(language: string | null): boolean {
    const config = this.getFormattingConfig(language);
    return config.showPinyin || false;
  }
}
