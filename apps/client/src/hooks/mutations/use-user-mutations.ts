import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation, I18nNamespace } from '@openai/i18n';
import { ApiCredentialsService } from '../../services/user/api-credentials.service';
import { queryKeys } from '../queries/query-keys';
import { useToast } from '../../contexts/ToastContext';

export function useUpdateApiKey() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { t } = useTranslation(I18nNamespace.CLIENT);

  return useMutation({
    mutationFn: (apiKey: string) => ApiCredentialsService.setOpenAIKey(apiKey),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user.apiKey() });
      showToast(t('profile.apiKey.updated'), 'success');
    },
    onError: (error: { message?: string }) => {
      showToast(error.message || t('profile.apiKey.updateFailed'), 'error');
    },
  });
}

export function useDeleteApiKey() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { t } = useTranslation(I18nNamespace.CLIENT);

  return useMutation({
    mutationFn: () => ApiCredentialsService.deleteOpenAIKey(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user.apiKey() });
      showToast(t('profile.apiKey.deleted'), 'success');
    },
    onError: (error: { message?: string }) => {
      showToast(error.message || t('profile.apiKey.deleteFailed'), 'error');
    },
  });
}
