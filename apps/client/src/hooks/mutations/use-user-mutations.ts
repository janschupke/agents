import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiCredentialsService } from '../../services/user/api-credentials.service';
import { queryKeys } from '../queries/query-keys';
import { useToast } from '../../contexts/ToastContext';

export function useUpdateApiKey() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (apiKey: string) => ApiCredentialsService.setOpenAIKey(apiKey),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user.apiKey() });
      showToast('API key updated successfully', 'success');
    },
    onError: (error: { message?: string }) => {
      showToast(error.message || 'Failed to update API key', 'error');
    },
  });
}

export function useDeleteApiKey() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: () => ApiCredentialsService.deleteOpenAIKey(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user.apiKey() });
      showToast('API key deleted successfully', 'success');
    },
    onError: (error: { message?: string }) => {
      showToast(error.message || 'Failed to delete API key', 'error');
    },
  });
}
