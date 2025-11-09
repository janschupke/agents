import { createContext, useContext, useState, ReactNode } from 'react';

interface AppContextValue {
  // Selected bot persistence
  selectedBotId: number | null;
  setSelectedBotId: (botId: number | null) => void;
  
  // Selected session ID (for navigation/state tracking)
  selectedSessionId: number | null;
  setSelectedSessionId: (sessionId: number | null) => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [selectedBotId, setSelectedBotId] = useState<number | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);

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
