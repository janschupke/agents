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

  describe('getSelectedAgentIdChat and setSelectedAgentIdChat', () => {
    it('should get and set selected agent ID for chat', () => {
      expect(LocalStorageManager.getSelectedAgentIdChat()).toBeNull();

      LocalStorageManager.setSelectedAgentIdChat(1);
      expect(LocalStorageManager.getSelectedAgentIdChat()).toBe(1);

      LocalStorageManager.setSelectedAgentIdChat(42);
      expect(LocalStorageManager.getSelectedAgentIdChat()).toBe(42);
    });

    it('should return null when agent ID is cleared', () => {
      LocalStorageManager.setSelectedAgentIdChat(1);
      expect(LocalStorageManager.getSelectedAgentIdChat()).toBe(1);

      LocalStorageManager.setSelectedAgentIdChat(null);
      expect(LocalStorageManager.getSelectedAgentIdChat()).toBeNull();
    });

    it('should return null for invalid stored values', () => {
      localStorage.setItem('selectedAgentId_chat', 'invalid');
      expect(LocalStorageManager.getSelectedAgentIdChat()).toBeNull();

      localStorage.setItem('selectedAgentId_chat', 'not-a-number');
      expect(LocalStorageManager.getSelectedAgentIdChat()).toBeNull();
    });
  });

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
      LocalStorageManager.setSelectedAgentIdChat(1);
      LocalStorageManager.setSelectedAgentIdConfig(2);
      LocalStorageManager.setSelectedSessionId(10);

      expect(LocalStorageManager.getSelectedAgentIdChat()).toBe(1);
      expect(LocalStorageManager.getSelectedAgentIdConfig()).toBe(2);
      expect(LocalStorageManager.getSelectedSessionId()).toBe(10);

      LocalStorageManager.clearAll();

      expect(LocalStorageManager.getSelectedAgentIdChat()).toBeNull();
      expect(LocalStorageManager.getSelectedAgentIdConfig()).toBeNull();
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
      const result = LocalStorageManager.getSelectedAgentIdChat();

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
      LocalStorageManager.setSelectedAgentIdChat(1);

      expect(consoleErrorSpy).toHaveBeenCalled();

      // Restore
      localStorage.setItem = originalSetItem;
    });
  });
});
