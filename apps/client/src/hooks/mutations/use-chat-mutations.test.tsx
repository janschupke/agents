import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { TestQueryProvider } from '../../test/utils/test-query-provider';
import { useSendMessage } from './use-chat-mutations';
import { MessageService } from '../../services/chat/message/message.service';

// Mock ToastContext
const mockShowToast = vi.fn();
vi.mock('../../contexts/ToastContext', () => ({
  useToast: () => ({ showToast: mockShowToast }),
}));

// Mock services
vi.mock('../../services/chat/message/message.service');

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <TestQueryProvider>{children}</TestQueryProvider>
);

describe('use-chat-mutations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useSendMessage', () => {
    it('should send message successfully', async () => {
      const mockResponse = {
        response: 'Hello! How can I help you?',
        session: {
          id: 1,
          session_name: 'Session 1',
        },
        userMessageId: 1,
        assistantMessageId: 2,
      };

      vi.mocked(MessageService.sendMessage).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useSendMessage(), { wrapper });

      await result.current.mutateAsync({
        agentId: 1,
        message: 'Hello',
        sessionId: 1,
      });

      expect(MessageService.sendMessage).toHaveBeenCalledWith(1, 'Hello', 1);
    });

    it('should send message without sessionId', async () => {
      const mockResponse = {
        response: 'Hello! How can I help you?',
        session: {
          id: 1,
          session_name: 'Session 1',
        },
      };

      vi.mocked(MessageService.sendMessage).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useSendMessage(), { wrapper });

      await result.current.mutateAsync({
        agentId: 1,
        message: 'Hello',
      });

      expect(MessageService.sendMessage).toHaveBeenCalledWith(
        1,
        'Hello',
        undefined
      );
    });

    it('should show error toast on failure', async () => {
      const error = { message: 'Failed to send message' };
      vi.mocked(MessageService.sendMessage).mockRejectedValue(error);

      const { result } = renderHook(() => useSendMessage(), { wrapper });

      await expect(
        result.current.mutateAsync({
          agentId: 1,
          message: 'Hello',
        })
      ).rejects.toThrow();

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith(
          'Failed to send message',
          'error'
        );
      });
    });

    it('should show generic error message when error has no message', async () => {
      const error = {};
      vi.mocked(MessageService.sendMessage).mockRejectedValue(error);

      const { result } = renderHook(() => useSendMessage(), { wrapper });

      await expect(
        result.current.mutateAsync({
          agentId: 1,
          message: 'Hello',
        })
      ).rejects.toThrow();

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith(
          'chat.errors.sendMessageError',
          'error'
        );
      });
    });
  });
});
