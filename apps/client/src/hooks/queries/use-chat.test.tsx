import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { TestQueryProvider } from '../../test/utils/test-query-provider';
import { useChatHistory } from './use-chat';
import { ChatService } from '../../services/chat.service';

// Mock AuthContext
const mockAuth = {
  isSignedIn: true,
  isLoaded: true,
};
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => mockAuth,
}));

// Mock useTokenReady
vi.mock('../use-token-ready', () => ({
  useTokenReady: () => true,
}));

// Mock services
vi.mock('../../services/chat.service');

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <TestQueryProvider>{children}</TestQueryProvider>
);

describe('use-chat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useChatHistory', () => {
    it('should fetch chat history when signed in and loaded', async () => {
      const mockChatHistory = {
        agent: {
          id: 1,
          name: 'Agent 1',
          description: 'Description 1',
        },
        session: {
          id: 1,
          session_name: 'Session 1',
        },
        messages: [],
      };

      vi.mocked(ChatService.getChatHistory).mockResolvedValue(mockChatHistory);

      const { result } = renderHook(() => useChatHistory(1, 1), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockChatHistory);
      expect(ChatService.getChatHistory).toHaveBeenCalledWith(1, 1);
    });

    it('should fetch chat history without sessionId', async () => {
      const mockChatHistory = {
        agent: {
          id: 1,
          name: 'Agent 1',
          description: 'Description 1',
        },
        session: null,
        messages: [],
      };

      vi.mocked(ChatService.getChatHistory).mockResolvedValue(mockChatHistory);

      const { result } = renderHook(() => useChatHistory(1, null), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(ChatService.getChatHistory).toHaveBeenCalledWith(1, undefined);
    });

    it('should not fetch when agentId is null', () => {
      const { result } = renderHook(() => useChatHistory(null, null), {
        wrapper,
      });

      expect(result.current.isFetching).toBe(false);
      expect(ChatService.getChatHistory).not.toHaveBeenCalled();
    });

    it('should not fetch when not signed in', () => {
      mockAuth.isSignedIn = false;
      mockAuth.isLoaded = true;

      const { result } = renderHook(() => useChatHistory(1, 1), { wrapper });

      expect(result.current.isFetching).toBe(false);
      expect(ChatService.getChatHistory).not.toHaveBeenCalled();
    });
  });
});
