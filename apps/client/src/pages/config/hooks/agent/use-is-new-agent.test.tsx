import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useIsNewAgent } from './use-is-new-agent';
import { ROUTES } from '../../../../constants/routes.constants';

// Mock react-router-dom
const mockUseLocation = vi.fn();
const mockUseParams = vi.fn();

vi.mock('react-router-dom', () => ({
  useLocation: () => mockUseLocation(),
  useParams: () => mockUseParams(),
}));

describe('useIsNewAgent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return true when propIsNewAgent is true', () => {
    mockUseLocation.mockReturnValue({ pathname: '/config/1' });
    mockUseParams.mockReturnValue({ agentId: '1' });

    const { result } = renderHook(() => useIsNewAgent(true));

    expect(result.current).toBe(true);
  });

  it('should return true when pathname is CONFIG_NEW', () => {
    mockUseLocation.mockReturnValue({ pathname: ROUTES.CONFIG_NEW });
    mockUseParams.mockReturnValue({ agentId: undefined });

    const { result } = renderHook(() => useIsNewAgent());

    expect(result.current).toBe(true);
  });

  it('should return true when urlAgentId is "new"', () => {
    mockUseLocation.mockReturnValue({ pathname: '/config/new' });
    mockUseParams.mockReturnValue({ agentId: 'new' });

    const { result } = renderHook(() => useIsNewAgent());

    expect(result.current).toBe(true);
  });

  it('should return false when none of the conditions are met', () => {
    mockUseLocation.mockReturnValue({ pathname: '/config/1' });
    mockUseParams.mockReturnValue({ agentId: '1' });

    const { result } = renderHook(() => useIsNewAgent());

    expect(result.current).toBe(false);
  });

  it('should prioritize propIsNewAgent over other conditions', () => {
    mockUseLocation.mockReturnValue({ pathname: '/config/1' });
    mockUseParams.mockReturnValue({ agentId: '1' });

    const { result } = renderHook(() => useIsNewAgent(true));

    expect(result.current).toBe(true);
  });
});
