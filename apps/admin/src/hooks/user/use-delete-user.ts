import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation, I18nNamespace } from '@openai/i18n';
import { UserService } from '../../services/user.service';
import { queryKeys } from '../queries/query-keys';
import { useToast } from '../../contexts/ToastContext';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../constants/routes.constants';

interface UseDeleteUserOptions {
  onSuccess?: () => void;
  redirectOnSuccess?: boolean;
}

export function useDeleteUser(options: UseDeleteUserOptions = {}) {
  const { t } = useTranslation(I18nNamespace.ADMIN);
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (id: string) => UserService.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user.list() });
      showToast(t('users.delete.success') || 'User deleted successfully', 'success');
      if (options.redirectOnSuccess) {
        navigate(ROUTES.USERS);
      }
      options.onSuccess?.();
    },
    onError: (error: unknown) => {
      const errorMessage =
        error && typeof error === 'object' && 'message' in error
          ? (error.message as string)
          : t('users.delete.error') || 'Failed to delete user';
      showToast(errorMessage, 'error');
    },
  });
}
