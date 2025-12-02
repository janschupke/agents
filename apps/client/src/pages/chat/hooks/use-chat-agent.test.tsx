import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useChatAgent } from './use-chat-agent';

// Mock AppContext
const mockSelectedAgentId = null;
const mockSetSelectedAgentId = vi.fn();
vi.mock('../../../contexts/AppContext', () => ({
  useSelectedAgent: () => ({
    selectedAgentId: mockSelectedAgentId,
    setSelectedAgentId: mockSetSelectedAgentId,
  }),
}));

// Mock useAgents
const mockAgents = [
  {
    id: 1,
    name: 'Agent 1',
    description: 'Description 1',
    avatarUrl: null,
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 2,
    name: 'Agent 2',
    description: 'Description 2',
    avatarUrl: null,
    createdAt: '2024-01-02T00:00:00.000Z',
  },
];

const mockUseAgents = vi.fn(() => ({
  data: mockAgents,
  isLoading: false,
}));

vi.mock('../../../hooks/queries/use-agents', () => ({
  useAgents: () => mockUseAgents(),
}));

describe('useChatAgent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAgents.mockReturnValue({
      data: mockAgents,
      isLoading: false,
    });
  });

  it('should return propAgentId when provided', () => {
    const { result } = renderHook(() => useChatAgent({ propAgentId: 2 }));

    expect(result.current.actualAgentId).toBe(2);
    expect(mockSetSelectedAgentId).toHaveBeenCalledWith(2);
  });

  it('should return selectedAgentId when no propAgentId', () => {
    const mockSelected = 1;
    vi.mock('../../../contexts/AppContext', () => ({
      useSelectedAgent: () => ({
        selectedAgentId: mockSelected,
        setSelectedAgentId: mockSetSelectedAgentId,
      }),
    }));

    const { result } = renderHook(() => useChatAgent({}));

    expect(result.current.actualAgentId).toBe(mockSelected);
  });

  it('should return first agent when no selection and agents available', () => {
    vi.mock('../../../contexts/AppContext', () => ({
      useSelectedAgent: () => ({
        selectedAgentId: null,
        setSelectedAgentId: mockSetSelectedAgentId,
      }),
    }));

    const { result } = renderHook(() => useChatAgent({}));

    expect(result.current.actualAgentId).toBe(1);
  });

  it('should return null when no agents available', () => {
    mockUseAgents.mockReturnValue({
      data: [],
      isLoading: false,
    });

    const { result } = renderHook(() => useChatAgent({}));

    expect(result.current.actualAgentId).toBeNull();
  });

  it('should return loading state', () => {
    mockUseAgents.mockReturnValue({
      data: undefined,
      isLoading: true,
    });

    const { result } = renderHook(() => useChatAgent({}));

    expect(result.current.loadingAgents).toBe(true);
  });

  it('should initialize agent selection when agents load', async () => {
    mockUseAgents.mockReturnValue({
      data: [],
      isLoading: true,
    });

    const { rerender } = renderHook(() => useChatAgent({}));

    mockUseAgents.mockReturnValue({
      data: mockAgents,
      isLoading: false,
    });

    rerender();

    await waitFor(() => {
      expect(mockSetSelectedAgentId).toHaveBeenCalled();
    });
  });
});
