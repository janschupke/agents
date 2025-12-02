import { expect, afterEach, beforeAll, afterAll, vi, beforeEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
import { server } from './mocks/server';
import { tokenProvider } from '../services/token-provider';

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Establish API mocking before all tests
beforeAll(() => {
  server.listen({
    onUnhandledRequest: 'bypass', // Bypass unhandled requests to avoid hanging
  });
});

// Set up token provider for tests before each test
beforeEach(() => {
  // Set up a mock token getter that returns a token immediately
  tokenProvider.setTokenGetter(async () => 'mock-token');
  // Note: We use real timers because userEvent and React Query need them
  // But we configure React Query to be fast and MSW responds instantly
});

// Reset any request handlers that are declared as a part of our tests
// (i.e. for testing one-off error scenarios)
afterEach(async () => {
  cleanup();
  server.resetHandlers();
  // Clear token provider
  tokenProvider.clearTokenGetter();
  // Clear any timers that might have been set
  vi.clearAllTimers();
});

// Clean up after the tests are finished
afterAll(async () => {
  // Clear token provider first
  tokenProvider.clearTokenGetter();
  // Close MSW server
  server.close();
});
