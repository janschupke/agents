import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation, I18nNamespace } from '@openai/i18n';
import { AgentArchetypeService } from '../../services/agent-archetype.service';
import { queryKeys } from '../queries/query-keys';
import { useToast } from '../../contexts/ToastContext';

export function useDeleteArchetype() {
  const { t } = useTranslation(I18nNamespace.ADMIN);
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => AgentArchetypeService.deleteArchetype(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.archetype.list() });
      showToast(t('archetypes.delete.success') || 'Archetype deleted successfully', 'success');
    },
    onError: (error: unknown) => {
      const errorMessage =
        error && typeof error === 'object' && 'message' in error
          ? (error.message as string)
          : t('archetypes.delete.error') || 'Failed to delete archetype';
      showToast(errorMessage, 'error');
    },
  });
}
