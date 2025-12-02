/**
 * Local storage manager for persisting app state
 */

const STORAGE_KEYS = {
  SELECTED_AGENT_ID_CHAT: 'selectedAgentId_chat',
  SELECTED_AGENT_ID_CONFIG: 'selectedAgentId_config',
  SELECTED_SESSION_ID: 'selectedSessionId',
} as const;

export class LocalStorageManager {
  /**
   * Get selected agent ID for chat view
   */
  static getSelectedAgentIdChat(): number | null {
    try {
      const value = localStorage.getItem(STORAGE_KEYS.SELECTED_AGENT_ID_CHAT);
      if (value === null) return null;
      const parsed = parseInt(value, 10);
      return isNaN(parsed) ? null : parsed;
    } catch (error) {
      console.error(
        'Error reading selectedAgentId_chat from localStorage:',
        error
      );
      return null;
    }
  }

  /**
   * Set selected agent ID for chat view
   */
  static setSelectedAgentIdChat(agentId: number | null): void {
    try {
      if (agentId === null) {
        localStorage.removeItem(STORAGE_KEYS.SELECTED_AGENT_ID_CHAT);
      } else {
        localStorage.setItem(
          STORAGE_KEYS.SELECTED_AGENT_ID_CHAT,
          String(agentId)
        );
      }
    } catch (error) {
      console.error(
        'Error writing selectedAgentId_chat to localStorage:',
        error
      );
    }
  }

  /**
   * Get selected agent ID for config view
   */
  static getSelectedAgentIdConfig(): number | null {
    try {
      const value = localStorage.getItem(STORAGE_KEYS.SELECTED_AGENT_ID_CONFIG);
      if (value === null) return null;
      const parsed = parseInt(value, 10);
      return isNaN(parsed) ? null : parsed;
    } catch (error) {
      console.error(
        'Error reading selectedAgentId_config from localStorage:',
        error
      );
      return null;
    }
  }

  /**
   * Set selected agent ID for config view
   */
  static setSelectedAgentIdConfig(agentId: number | null): void {
    try {
      if (agentId === null) {
        localStorage.removeItem(STORAGE_KEYS.SELECTED_AGENT_ID_CONFIG);
      } else {
        localStorage.setItem(
          STORAGE_KEYS.SELECTED_AGENT_ID_CONFIG,
          String(agentId)
        );
      }
    } catch (error) {
      console.error(
        'Error writing selectedAgentId_config to localStorage:',
        error
      );
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
      console.error(
        'Error reading selectedSessionId from localStorage:',
        error
      );
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
        localStorage.setItem(
          STORAGE_KEYS.SELECTED_SESSION_ID,
          String(sessionId)
        );
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
