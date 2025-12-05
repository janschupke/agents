import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageService } from '../../services/chat/message/message.service';
import { queryKeys } from '../queries/query-keys';
import { useToast } from '../../contexts/ToastContext';
import { useTranslation, I18nNamespace } from '@openai/i18n';

export function useSendMessage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { t } = useTranslation(I18nNamespace.CLIENT);

  return useMutation({
    mutationFn: ({
      agentId,
      message,
      sessionId,
    }: {
      agentId: number;
      message: string;
      sessionId?: number;
    }) => MessageService.sendMessage(agentId, message, sessionId),
    onSuccess: (_data, variables) => {
      // Invalidate chat history to refetch with new message
      queryClient.invalidateQueries({
        queryKey: queryKeys.chat.history(
          variables.agentId,
          variables.sessionId
        ),
      });
      // Always invalidate sessions list to reorder by last message date
      // This ensures the session with the new message moves to the top
      queryClient.invalidateQueries({
        queryKey: queryKeys.chat.sessions(variables.agentId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.agents.sessions(variables.agentId),
      });
      // Invalidate memories to refetch after potential memory creation
      // Memories are created every 10 messages, so we invalidate after each message
      queryClient.invalidateQueries({
        queryKey: queryKeys.agents.memories(variables.agentId),
      });
    },
    onError: (error: { message?: string }) => {
      showToast(error.message || t('chat.errors.sendMessageError'), 'error');
    },
  });
}
