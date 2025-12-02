import type { KnipConfig } from 'knip';

const config: KnipConfig = {
  workspaces: {
    'apps/api': {
      entry: ['src/main.ts'],
      project: ['src/**/*.ts', '!src/**/*.spec.ts', '!src/**/*.test.ts'],
    },
    'apps/client': {
      entry: ['src/main.tsx', 'index.html', 'vite.config.ts'],
      project: ['src/**/*.{ts,tsx}', '!src/**/*.test.{ts,tsx}', '!src/**/*.spec.{ts,tsx}'],
    },
    'apps/admin': {
      entry: ['src/main.tsx', 'index.html', 'vite.config.ts'],
      project: ['src/**/*.{ts,tsx}', '!src/**/*.test.{ts,tsx}', '!src/**/*.spec.{ts,tsx}'],
    },
    'packages/i18n': {
      entry: ['src/index.ts'],
      project: ['src/**/*.ts', '!src/**/*.test.ts', '!src/**/*.spec.ts'],
    },
    'packages/utils': {
      entry: ['src/index.ts'],
      project: ['src/**/*.ts', '!src/**/*.test.ts', '!src/**/*.spec.ts'],
    },
  },
  ignore: [
    '**/dist/**',
    '**/node_modules/**',
    '**/*.d.ts',
    '**/coverage/**',
    '**/.next/**',
    '**/build/**',
    '**/test/**',
    '**/tests/**',
    '**/*.test.{ts,tsx}',
    '**/*.spec.{ts,tsx}',
  ],
  ignoreDependencies: [
    // Build tools
    'vite',
    'typescript',
    '@vitejs/plugin-react',
    'tsx',
    'ts-node',
    'tsconfig-paths',
    // Testing
    'vitest',
    '@vitest/ui',
    '@vitest/coverage-v8',
    'jest',
    'ts-jest',
    '@testing-library/react',
    '@testing-library/jest-dom',
    '@testing-library/user-event',
    'msw',
    'supertest',
    // Linting/Formatting
    'eslint',
    'prettier',
    '@typescript-eslint/eslint-plugin',
    '@typescript-eslint/parser',
    'eslint-plugin-react-hooks',
    'eslint-plugin-react-refresh',
    // Other dev tools
    'concurrently',
    'i18next-parser',
  ],
};

export default config;
