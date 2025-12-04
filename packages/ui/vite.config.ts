/// <reference types="vitest/config" />
import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: false, // Disable CSS processing for faster tests
    testTimeout: 1000, // 1 second timeout per test (unit tests should be fast)
    hookTimeout: 1000,
    teardownTimeout: 500,
    pool: 'threads', // Run tests in parallel threads
    poolOptions: {
      threads: {
        singleThread: false,
      },
    },
  },
});
