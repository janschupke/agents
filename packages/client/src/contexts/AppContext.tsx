import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { LocalStorageManager } from '../utils/localStorage';

interface AppContextValue {
  // Selected bot persistence (for chat view)
  selectedBotId: number | null;
  setSelectedBotId: (botId: number | null) => void;

  // Selected session ID (for navigation/state tracking)
  selectedSessionId: number | null;
  setSelectedSessionId: (sessionId: number | null) => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  // Load initial values from localStorage
  const [selectedBotId, setSelectedBotIdState] = useState<number | null>(() =>
    LocalStorageManager.getSelectedBotIdChat()
  );
  const [selectedSessionId, setSelectedSessionIdState] = useState<number | null>(() =>
    LocalStorageManager.getSelectedSessionId()
  );

  // Save to localStorage whenever values change
  useEffect(() => {
    LocalStorageManager.setSelectedBotIdChat(selectedBotId);
  }, [selectedBotId]);

  useEffect(() => {
    LocalStorageManager.setSelectedSessionId(selectedSessionId);
  }, [selectedSessionId]);

  // Wrapper functions to update state (localStorage is saved via useEffect above)
  const setSelectedBotId = (botId: number | null) => {
    setSelectedBotIdState(botId);
  };

  const setSelectedSessionId = (sessionId: number | null) => {
    setSelectedSessionIdState(sessionId);
  };

  const value: AppContextValue = {
    selectedBotId,
    setSelectedBotId,
    selectedSessionId,
    setSelectedSessionId,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}

// Convenience hooks
export function useSelectedBot() {
  const { selectedBotId, setSelectedBotId } = useAppContext();
  return { selectedBotId, setSelectedBotId };
}

export function useSelectedSession() {
  const { selectedSessionId, setSelectedSessionId } = useAppContext();
  return { selectedSessionId, setSelectedSessionId };
}
