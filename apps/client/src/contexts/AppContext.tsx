import {
  createContext,
  useContext,
  ReactNode,
} from 'react';

interface AppContextValue {
  // AppContext simplified - agent and session IDs now come from URL
  // Keep structure for future app-wide state if needed
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const value: AppContextValue = {
    // Future app-wide state can be added here
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

// Note: useSelectedAgent and useSelectedSession removed
// Agent and session IDs now come from URL parameters
