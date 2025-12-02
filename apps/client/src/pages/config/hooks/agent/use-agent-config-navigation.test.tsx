import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAgentConfigNavigation } from './use-agent-config-navigation';
import { ROUTES } from '../../../../constants/routes.constants';

// Mock dependencies
const mockNavigate = vi.fn();
const mockSetSelectedAgentIdConfig = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('../../../../utils/localStorage', () => ({
  LocalStorageManager: {
    setSelectedAgentIdConfig: mockSetSelectedAgentIdConfig,
  },
}));

describe('useAgentConfigNavigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should navigate to agent config when handleAgentSelect is called', () => {
    const { result } = renderHook(() =>
      useAgentConfigNavigation({ navigate: mockNavigate })
    );

    result.current.handleAgentSelect(1);

    expect(mockSetSelectedAgentIdConfig).toHaveBeenCalledWith(1);
    expect(mockNavigate).toHaveBeenCalledWith(ROUTES.CONFIG_AGENT(1));
  });

  it('should navigate to new agent route when handleNewAgent is called', () => {
    const { result } = renderHook(() =>
      useAgentConfigNavigation({ navigate: mockNavigate })
    );

    result.current.handleNewAgent();

    expect(mockNavigate).toHaveBeenCalledWith(ROUTES.CONFIG_NEW);
  });

  it('should navigate and save agent ID when handleSave is called', async () => {
    const { result } = renderHook(() =>
      useAgentConfigNavigation({ navigate: mockNavigate })
    );

    await result.current.handleSave({} as unknown, 2);

    expect(mockSetSelectedAgentIdConfig).toHaveBeenCalledWith(2);
    expect(mockNavigate).toHaveBeenCalledWith(ROUTES.CONFIG_AGENT(2), {
      replace: true,
    });
  });

  it('should memoize callbacks', () => {
    const { result, rerender } = renderHook(() =>
      useAgentConfigNavigation({ navigate: mockNavigate })
    );

    const firstHandleAgentSelect = result.current.handleAgentSelect;
    const firstHandleNewAgent = result.current.handleNewAgent;
    const firstHandleSave = result.current.handleSave;

    rerender();

    expect(result.current.handleAgentSelect).toBe(firstHandleAgentSelect);
    expect(result.current.handleNewAgent).toBe(firstHandleNewAgent);
    expect(result.current.handleSave).toBe(firstHandleSave);
  });
});
