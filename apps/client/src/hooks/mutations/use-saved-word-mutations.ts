import { useMutation, useQueryClient } from '@tanstack/react-query';
import { SavedWordService } from '../../services/saved-word/saved-word.service';
import {
  CreateSavedWordRequest,
  UpdateSavedWordRequest,
  AddSentenceRequest,
} from '../../types/saved-word.types';
import { queryKeys } from '../queries/query-keys';

export function useCreateSavedWord() {
  const queryClient = useQueryClient();

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
    },
  });
}

export function useUpdateSavedWord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: UpdateSavedWordRequest;
    }) => SavedWordService.updateSavedWord(id, data),
    onSuccess: (_, variables) => {
      // Invalidate specific word and list
      queryClient.invalidateQueries({
        queryKey: queryKeys.savedWords.detail(variables.id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.savedWords.all(),
      });
    },
  });
}

export function useDeleteSavedWord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => SavedWordService.deleteSavedWord(id),
    onSuccess: () => {
      // Invalidate all saved word queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.savedWords.all(),
      });
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
      // Invalidate specific word
      queryClient.invalidateQueries({
        queryKey: queryKeys.savedWords.detail(variables.savedWordId),
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
      // Invalidate specific word
      queryClient.invalidateQueries({
        queryKey: queryKeys.savedWords.detail(variables.savedWordId),
      });
    },
  });
}
