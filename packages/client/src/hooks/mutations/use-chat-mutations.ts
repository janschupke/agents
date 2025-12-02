import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ChatService } from '../../services/chat.service.js';
import { queryKeys } from '../queries/query-keys.js';
import { useToast } from '../../contexts/ToastContext.js';

export function useSendMessage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: ({
      botId,
      message,
      sessionId,
    }: {
      botId: number;
      message: string;
      sessionId?: number;
    }) => ChatService.sendMessage(botId, message, sessionId),
    onSuccess: (data, variables) => {
      // Invalidate chat history to refetch with new message
      queryClient.invalidateQueries({
        queryKey: queryKeys.chat.history(variables.botId, variables.sessionId),
      });
      // If new session was created, invalidate sessions list
      if (data.session?.id && data.session.id !== variables.sessionId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.chat.sessions(variables.botId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.bots.sessions(variables.botId) });
      }
    },
    onError: (error: { message?: string }) => {
      showToast(error.message || 'Failed to send message', 'error');
    },
  });
}
