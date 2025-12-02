import '@testing-library/jest-dom';
import { vi } from 'vitest';
import { mockUseTranslation } from './mocks/i18n';

// Mock i18n to return keys instead of translations
vi.mock('@openai/i18n', () => ({
  useTranslation: () => mockUseTranslation(),
  I18nNamespace: {
    COMMON: 'common',
    CLIENT: 'client',
    ADMIN: 'admin',
    API: 'api',
  },
  initI18n: vi.fn(),
  i18n: {
    language: 'en',
    changeLanguage: vi.fn(),
  },
}));
