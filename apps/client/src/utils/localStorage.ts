/**
 * Local storage manager for persisting app state
 */

const STORAGE_KEYS = {
  SELECTED_AGENT_ID_CONFIG: 'selectedAgentId_config',
} as const;

export class LocalStorageManager {
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
