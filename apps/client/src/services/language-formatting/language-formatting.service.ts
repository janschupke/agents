interface LanguageFormattingConfig {
  showPinyin: boolean;
  showFurigana?: boolean; // For Japanese (future)
  showRomanization?: boolean; // For Korean (future)
  // Extensible for future formatting options
}

export class LanguageFormattingService {
  /**
   * Get formatting configuration for a language
   */
  static getFormattingConfig(
    language: string | null
  ): LanguageFormattingConfig {
    if (!language) {
      return { showPinyin: false };
    }

    // Chinese variants
    if (language.startsWith('zh')) {
      return { showPinyin: true };
    }

    // Japanese (future)
    if (language === 'ja') {
      return { showPinyin: false, showFurigana: true };
    }

    // Korean (future)
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
