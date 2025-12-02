import { vi } from 'vitest';

/**
 * Mock implementation of useTranslation that returns keys instead of translations.
 * This makes tests more stable and language-independent.
 *
 * Usage: The t function will return the key itself, so tests can check for keys
 * like 'chat.placeholder' instead of 'Type your message...'
 */
export const mockUseTranslation = () => {
  // Mock t function that returns the key itself
  const mockT = vi.fn((key: string, options?: Record<string, unknown>) => {
    // If there are interpolation options, we still return the key
    // but could format it if needed
    if (options && Object.keys(options).length > 0) {
      // For now, just return the key
      return key;
    }
    return key;
  });

  return {
    t: mockT,
    i18n: {
      language: 'en',
      changeLanguage: vi.fn(),
    },
    ready: true,
  };
};
