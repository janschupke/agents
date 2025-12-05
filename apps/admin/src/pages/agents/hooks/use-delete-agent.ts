import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation, I18nNamespace } from '@openai/i18n';
import { AgentService } from '../../../services/agent.service';
import { queryKeys } from '../../../hooks/queries/query-keys';
import { useToast } from '../../../contexts/ToastContext';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../constants/routes.constants';

interface UseDeleteAgentOptions {
  onSuccess?: () => void;
  redirectOnSuccess?: boolean;
}

export function useDeleteAgent(options: UseDeleteAgentOptions = {}) {
  const { t } = useTranslation(I18nNamespace.ADMIN);
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (id: number) => AgentService.deleteAgent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.agent.list() });
      showToast(
        t('agents.delete.success') || 'Agent deleted successfully',
        'success'
      );
      if (options.redirectOnSuccess) {
        navigate(ROUTES.AGENTS);
      }
      options.onSuccess?.();
    },
    onError: (error: unknown) => {
      const errorMessage =
        error && typeof error === 'object' && 'message' in error
          ? (error.message as string)
          : t('agents.delete.error') || 'Failed to delete agent';
      showToast(errorMessage, 'error');
    },
  });
}
