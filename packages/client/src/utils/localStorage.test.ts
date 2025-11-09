import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LocalStorageManager } from './localStorage.js';

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

  describe('getSelectedBotIdChat and setSelectedBotIdChat', () => {
    it('should get and set selected bot ID for chat', () => {
      expect(LocalStorageManager.getSelectedBotIdChat()).toBeNull();

      LocalStorageManager.setSelectedBotIdChat(1);
      expect(LocalStorageManager.getSelectedBotIdChat()).toBe(1);

      LocalStorageManager.setSelectedBotIdChat(42);
      expect(LocalStorageManager.getSelectedBotIdChat()).toBe(42);
    });

    it('should return null when bot ID is cleared', () => {
      LocalStorageManager.setSelectedBotIdChat(1);
      expect(LocalStorageManager.getSelectedBotIdChat()).toBe(1);

      LocalStorageManager.setSelectedBotIdChat(null);
      expect(LocalStorageManager.getSelectedBotIdChat()).toBeNull();
    });

    it('should return null for invalid stored values', () => {
      localStorage.setItem('selectedBotId_chat', 'invalid');
      expect(LocalStorageManager.getSelectedBotIdChat()).toBeNull();

      localStorage.setItem('selectedBotId_chat', 'not-a-number');
      expect(LocalStorageManager.getSelectedBotIdChat()).toBeNull();
    });
  });

  describe('getSelectedBotIdConfig and setSelectedBotIdConfig', () => {
    it('should get and set selected bot ID for config', () => {
      expect(LocalStorageManager.getSelectedBotIdConfig()).toBeNull();

      LocalStorageManager.setSelectedBotIdConfig(2);
      expect(LocalStorageManager.getSelectedBotIdConfig()).toBe(2);

      LocalStorageManager.setSelectedBotIdConfig(99);
      expect(LocalStorageManager.getSelectedBotIdConfig()).toBe(99);
    });

    it('should return null when bot ID is cleared', () => {
      LocalStorageManager.setSelectedBotIdConfig(2);
      expect(LocalStorageManager.getSelectedBotIdConfig()).toBe(2);

      LocalStorageManager.setSelectedBotIdConfig(null);
      expect(LocalStorageManager.getSelectedBotIdConfig()).toBeNull();
    });

    it('should handle invalid stored values', () => {
      localStorage.setItem('selectedBotId_config', 'abc');
      expect(LocalStorageManager.getSelectedBotIdConfig()).toBeNull();
    });
  });

  describe('getSelectedSessionId and setSelectedSessionId', () => {
    it('should get and set selected session ID', () => {
      expect(LocalStorageManager.getSelectedSessionId()).toBeNull();

      LocalStorageManager.setSelectedSessionId(10);
      expect(LocalStorageManager.getSelectedSessionId()).toBe(10);

      LocalStorageManager.setSelectedSessionId(20);
      expect(LocalStorageManager.getSelectedSessionId()).toBe(20);
    });

    it('should return null when session ID is cleared', () => {
      LocalStorageManager.setSelectedSessionId(10);
      expect(LocalStorageManager.getSelectedSessionId()).toBe(10);

      LocalStorageManager.setSelectedSessionId(null);
      expect(LocalStorageManager.getSelectedSessionId()).toBeNull();
    });

    it('should handle invalid stored values', () => {
      localStorage.setItem('selectedSessionId', 'xyz');
      expect(LocalStorageManager.getSelectedSessionId()).toBeNull();
    });
  });

  describe('clearAll', () => {
    it('should clear all stored values', () => {
      LocalStorageManager.setSelectedBotIdChat(1);
      LocalStorageManager.setSelectedBotIdConfig(2);
      LocalStorageManager.setSelectedSessionId(10);

      expect(LocalStorageManager.getSelectedBotIdChat()).toBe(1);
      expect(LocalStorageManager.getSelectedBotIdConfig()).toBe(2);
      expect(LocalStorageManager.getSelectedSessionId()).toBe(10);

      LocalStorageManager.clearAll();

      expect(LocalStorageManager.getSelectedBotIdChat()).toBeNull();
      expect(LocalStorageManager.getSelectedBotIdConfig()).toBeNull();
      expect(LocalStorageManager.getSelectedSessionId()).toBeNull();
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
      const result = LocalStorageManager.getSelectedBotIdChat();

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
      LocalStorageManager.setSelectedBotIdChat(1);

      expect(consoleErrorSpy).toHaveBeenCalled();

      // Restore
      localStorage.setItem = originalSetItem;
    });
  });
});
