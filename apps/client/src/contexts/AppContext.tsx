import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { LocalStorageManager } from '../utils/localStorage';

interface AppContextValue {
  // Selected agent persistence (for chat view)
  selectedAgentId: number | null;
  setSelectedAgentId: (agentId: number | null) => void;

  // Selected session ID (for navigation/state tracking)
  selectedSessionId: number | null;
  setSelectedSessionId: (sessionId: number | null) => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  // Load initial values from localStorage
  const [selectedAgentId, setSelectedAgentIdState] = useState<number | null>(
    () => LocalStorageManager.getSelectedAgentIdChat()
  );
  const [selectedSessionId, setSelectedSessionIdState] = useState<
    number | null
  >(() => LocalStorageManager.getSelectedSessionId());

  // Save to localStorage whenever values change
  useEffect(() => {
    LocalStorageManager.setSelectedAgentIdChat(selectedAgentId);
  }, [selectedAgentId]);

  useEffect(() => {
    LocalStorageManager.setSelectedSessionId(selectedSessionId);
  }, [selectedSessionId]);

  // Wrapper functions to update state (localStorage is saved via useEffect above)
  const setSelectedAgentId = (agentId: number | null) => {
    setSelectedAgentIdState(agentId);
  };

  const setSelectedSessionId = (sessionId: number | null) => {
    setSelectedSessionIdState(sessionId);
  };

  const value: AppContextValue = {
    selectedAgentId,
    setSelectedAgentId,
    selectedSessionId,
    setSelectedSessionId,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}

// Convenience hooks
export function useSelectedAgent() {
  const { selectedAgentId, setSelectedAgentId } = useAppContext();
  return { selectedAgentId, setSelectedAgentId };
}
