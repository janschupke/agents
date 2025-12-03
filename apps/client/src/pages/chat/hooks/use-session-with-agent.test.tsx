import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useSessionWithAgent } from './use-session-with-agent';
import { TestQueryProvider } from '../../../test/utils/test-query-provider';
import { Session } from '../../../types/chat.types';

// Mock dependencies
const mockUseQuery = vi.fn();
const mockShowToast = vi.fn();

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual<typeof import('@tanstack/react-query')>(
    '@tanstack/react-query'
  );
  return {
    ...actual,
    useQuery: (options: unknown) => mockUseQuery(options),
  };
});

vi.mock('../../../contexts/ToastContext', () => ({
  useToast: () => ({
    showToast: mockShowToast,
  }),
}));

vi.mock('../../../services/chat.service', () => ({
  ChatService: {
    getSessionWithAgent: vi.fn(),
  },
}));

vi.mock('@openai/i18n', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
  I18nNamespace: {
    CLIENT: 'client',
  },
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <TestQueryProvider>{children}</TestQueryProvider>
);

describe('useSessionWithAgent', () => {
  const mockSession: Session = {
    id: 1,
    session_name: 'Test Session',
    createdAt: '2024-01-01T00:00:00.000Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return session and agentId when query succeeds', async () => {
    mockUseQuery.mockReturnValue({
      data: {
        session: mockSession,
        agentId: 2,
      },
      isLoading: false,
      isError: false,
      error: null,
    });

    const { result } = renderHook(() => useSessionWithAgent(1), { wrapper });

    expect(result.current.session).toEqual(mockSession);
    expect(result.current.agentId).toBe(2);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should return null when sessionId is null', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
    });

    const { result } = renderHook(() => useSessionWithAgent(null), {
      wrapper,
    });

    expect(result.current.session).toBeUndefined();
    expect(result.current.agentId).toBeNull();
  });

  it('should return null when sessionId is 0 or negative', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
    });

    const { result } = renderHook(() => useSessionWithAgent(0), { wrapper });

    expect(result.current.session).toBeUndefined();
    expect(result.current.agentId).toBeNull();
  });

  it('should show error toast when query fails', async () => {
    const error = new Error('Failed to fetch session');
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error,
    });

    renderHook(() => useSessionWithAgent(1), { wrapper });

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith(
        'Failed to fetch session',
        'error'
      );
    });
  });

  it('should return loading state', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    });

    const { result } = renderHook(() => useSessionWithAgent(1), { wrapper });

    expect(result.current.loading).toBe(true);
  });

  it('should return error message when query fails', () => {
    const error = new Error('Network error');
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error,
    });

    const { result } = renderHook(() => useSessionWithAgent(1), { wrapper });

    expect(result.current.error).toBe('Network error');
  });
});
