import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LocalStorageManager } from './localStorage';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('LocalStorageManager', () => {
  beforeEach(() => {
    localStorage.clear();
    // Suppress console.error in tests
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // getSelectedAgentIdChat and setSelectedAgentIdChat removed - chat agent ID now comes from URL

  describe('getSelectedAgentIdConfig and setSelectedAgentIdConfig', () => {
    it('should get and set selected agent ID for config', () => {
      expect(LocalStorageManager.getSelectedAgentIdConfig()).toBeNull();

      LocalStorageManager.setSelectedAgentIdConfig(2);
      expect(LocalStorageManager.getSelectedAgentIdConfig()).toBe(2);

      LocalStorageManager.setSelectedAgentIdConfig(99);
      expect(LocalStorageManager.getSelectedAgentIdConfig()).toBe(99);
    });

    it('should return null when agent ID is cleared', () => {
      LocalStorageManager.setSelectedAgentIdConfig(2);
      expect(LocalStorageManager.getSelectedAgentIdConfig()).toBe(2);

      LocalStorageManager.setSelectedAgentIdConfig(null);
      expect(LocalStorageManager.getSelectedAgentIdConfig()).toBeNull();
    });

    it('should handle invalid stored values', () => {
      localStorage.setItem('selectedAgentId_config', 'abc');
      expect(LocalStorageManager.getSelectedAgentIdConfig()).toBeNull();
    });
  });

  // getSelectedSessionId and setSelectedSessionId removed - session ID now comes from URL

  describe('clearAll', () => {
    it('should clear all stored values', () => {
      LocalStorageManager.setSelectedAgentIdConfig(2);

      expect(LocalStorageManager.getSelectedAgentIdConfig()).toBe(2);

      LocalStorageManager.clearAll();

      expect(LocalStorageManager.getSelectedAgentIdConfig()).toBeNull();
    });
  });

  describe('error handling', () => {
    it('should handle localStorage errors gracefully', () => {
      // Mock localStorage.getItem to throw an error
      const originalGetItem = localStorage.getItem;
      localStorage.getItem = vi.fn(() => {
        throw new Error('Storage quota exceeded');
      });

      const consoleErrorSpy = vi.spyOn(console, 'error');
      const result = LocalStorageManager.getSelectedAgentIdConfig();

      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalled();

      // Restore
      localStorage.getItem = originalGetItem;
    });

    it('should handle localStorage setItem errors gracefully', () => {
      // Mock localStorage.setItem to throw an error
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = vi.fn(() => {
        throw new Error('Storage quota exceeded');
      });

      const consoleErrorSpy = vi.spyOn(console, 'error');
      LocalStorageManager.setSelectedAgentIdConfig(1);

      expect(consoleErrorSpy).toHaveBeenCalled();

      // Restore
      localStorage.setItem = originalSetItem;
    });
  });
});
