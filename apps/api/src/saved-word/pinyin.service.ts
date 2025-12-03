import { Injectable } from '@nestjs/common';
import { pinyin } from 'pinyin-pro';

@Injectable()
export class PinyinService {
  /**
   * Convert Chinese characters to pinyin with tones as letter accents
   * Uses 'pinyin-pro' library with toneType: 'symbol' option
   */
  toPinyin(chineseText: string): string | null {
    if (!this.containsChinese(chineseText)) {
      return null;
    }

    try {
      return pinyin(chineseText, { toneType: 'symbol' });
    } catch (error) {
      // Return null if pinyin conversion fails
      return null;
    }
  }

  /**
   * Check if text contains Chinese characters
   */
  containsChinese(text: string): boolean {
    return /[\u4e00-\u9fff]/.test(text);
  }
}
