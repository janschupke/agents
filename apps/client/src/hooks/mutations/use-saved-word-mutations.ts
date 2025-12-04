import { useMutation, useQueryClient } from '@tanstack/react-query';
import { SavedWordService } from '../../services/saved-word/saved-word.service';
import {
  CreateSavedWordRequest,
  UpdateSavedWordRequest,
  AddSentenceRequest,
} from '../../types/saved-word.types';
import { queryKeys } from '../queries/query-keys';
import { useToast } from '../../contexts/ToastContext';
import { useTranslation, I18nNamespace } from '@openai/i18n';

export function useCreateSavedWord() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { t } = useTranslation(I18nNamespace.CLIENT);

  return useMutation({
    mutationFn: (data: CreateSavedWordRequest) =>
      SavedWordService.createSavedWord(data),
    onSuccess: () => {
      // Invalidate saved words list
      queryClient.invalidateQueries({
        queryKey: queryKeys.savedWords.all(),
      });
      // Invalidate matching words queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.savedWords.matchingPrefix(),
      });
      // Invalidate all chat history queries to update highlights in real-time
      queryClient.invalidateQueries({
        queryKey: queryKeys.chat.all,
      });
      showToast(
        t('savedWords.saveSuccess') || 'Word saved successfully',
        'success'
      );
    },
    onError: (error: { message?: string }) => {
      showToast(
        error.message || t('savedWords.saveError') || 'Failed to save word',
        'error'
      );
    },
  });
}

export function useUpdateSavedWord() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { t } = useTranslation(I18nNamespace.CLIENT);

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateSavedWordRequest }) =>
      SavedWordService.updateSavedWord(id, data),
    onSuccess: (_, variables) => {
      // Invalidate specific word and list
      queryClient.invalidateQueries({
        queryKey: queryKeys.savedWords.detail(variables.id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.savedWords.all(),
      });
      // Invalidate matching words queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.savedWords.matchingPrefix(),
      });
      // Invalidate all chat history queries to update highlights in real-time
      queryClient.invalidateQueries({
        queryKey: queryKeys.chat.all,
      });
      showToast(
        t('savedWords.updateSuccess') || 'Word updated successfully',
        'success'
      );
    },
    onError: (error: { message?: string }) => {
      showToast(
        error.message || t('savedWords.updateError') || 'Failed to update word',
        'error'
      );
    },
  });
}

export function useDeleteSavedWord() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { t } = useTranslation(I18nNamespace.CLIENT);

  return useMutation({
    mutationFn: (id: number) => SavedWordService.deleteSavedWord(id),
    onSuccess: () => {
      // Invalidate all saved word queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.savedWords.all(),
      });
      // Invalidate matching words queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.savedWords.matchingPrefix(),
      });
      // Invalidate all chat history queries to update highlights in real-time
      queryClient.invalidateQueries({
        queryKey: queryKeys.chat.all,
      });
      showToast(
        t('savedWords.deleteSuccess') || 'Word deleted successfully',
        'success'
      );
    },
    onError: (error: { message?: string }) => {
      showToast(
        error.message || t('savedWords.deleteError') || 'Failed to delete word',
        'error'
      );
    },
  });
}

export function useAddSentence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      savedWordId,
      data,
    }: {
      savedWordId: number;
      data: AddSentenceRequest;
    }) => SavedWordService.addSentence(savedWordId, data),
    onSuccess: (_, variables) => {
      // Invalidate specific word and list
      queryClient.invalidateQueries({
        queryKey: queryKeys.savedWords.detail(variables.savedWordId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.savedWords.all(),
      });
    },
  });
}

export function useRemoveSentence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      savedWordId,
      sentenceId,
    }: {
      savedWordId: number;
      sentenceId: number;
    }) => SavedWordService.removeSentence(savedWordId, sentenceId),
    onSuccess: (_, variables) => {
      // Invalidate specific word and list
      queryClient.invalidateQueries({
        queryKey: queryKeys.savedWords.detail(variables.savedWordId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.savedWords.all(),
      });
    },
  });
}
