/**
 * Local storage manager for persisting app state
 */

const STORAGE_KEYS = {
  SELECTED_BOT_ID_CHAT: 'selectedBotId_chat',
  SELECTED_BOT_ID_CONFIG: 'selectedBotId_config',
  SELECTED_SESSION_ID: 'selectedSessionId',
} as const;

export class LocalStorageManager {
  /**
   * Get selected bot ID for chat view
   */
  static getSelectedBotIdChat(): number | null {
    try {
      const value = localStorage.getItem(STORAGE_KEYS.SELECTED_BOT_ID_CHAT);
      if (value === null) return null;
      const parsed = parseInt(value, 10);
      return isNaN(parsed) ? null : parsed;
    } catch (error) {
      console.error('Error reading selectedBotId_chat from localStorage:', error);
      return null;
    }
  }

  /**
   * Set selected bot ID for chat view
   */
  static setSelectedBotIdChat(botId: number | null): void {
    try {
      if (botId === null) {
        localStorage.removeItem(STORAGE_KEYS.SELECTED_BOT_ID_CHAT);
      } else {
        localStorage.setItem(STORAGE_KEYS.SELECTED_BOT_ID_CHAT, String(botId));
      }
    } catch (error) {
      console.error('Error writing selectedBotId_chat to localStorage:', error);
    }
  }

  /**
   * Get selected bot ID for config view
   */
  static getSelectedBotIdConfig(): number | null {
    try {
      const value = localStorage.getItem(STORAGE_KEYS.SELECTED_BOT_ID_CONFIG);
      if (value === null) return null;
      const parsed = parseInt(value, 10);
      return isNaN(parsed) ? null : parsed;
    } catch (error) {
      console.error('Error reading selectedBotId_config from localStorage:', error);
      return null;
    }
  }

  /**
   * Set selected bot ID for config view
   */
  static setSelectedBotIdConfig(botId: number | null): void {
    try {
      if (botId === null) {
        localStorage.removeItem(STORAGE_KEYS.SELECTED_BOT_ID_CONFIG);
      } else {
        localStorage.setItem(STORAGE_KEYS.SELECTED_BOT_ID_CONFIG, String(botId));
      }
    } catch (error) {
      console.error('Error writing selectedBotId_config to localStorage:', error);
    }
  }

  /**
   * Get selected session ID
   */
  static getSelectedSessionId(): number | null {
    try {
      const value = localStorage.getItem(STORAGE_KEYS.SELECTED_SESSION_ID);
      if (value === null) return null;
      const parsed = parseInt(value, 10);
      return isNaN(parsed) ? null : parsed;
    } catch (error) {
      console.error('Error reading selectedSessionId from localStorage:', error);
      return null;
    }
  }

  /**
   * Set selected session ID
   */
  static setSelectedSessionId(sessionId: number | null): void {
    try {
      if (sessionId === null) {
        localStorage.removeItem(STORAGE_KEYS.SELECTED_SESSION_ID);
      } else {
        localStorage.setItem(STORAGE_KEYS.SELECTED_SESSION_ID, String(sessionId));
      }
    } catch (error) {
      console.error('Error writing selectedSessionId to localStorage:', error);
    }
  }

  /**
   * Clear all stored values
   */
  static clearAll(): void {
    try {
      Object.values(STORAGE_KEYS).forEach((key) => {
        localStorage.removeItem(key);
      });
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  }
}
