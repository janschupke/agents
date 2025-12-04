import { useQuery } from '@tanstack/react-query';
import { SavedWordService } from '../../services/saved-word/saved-word.service';
import { queryKeys } from './query-keys';
import {
  SESSIONS_STALE_TIME,
  CHAT_HISTORY_STALE_TIME,
} from '../../constants/cache.constants';
import { SavedWord, SavedWordMatch } from '../../types/saved-word.types';

export function useSavedWords(language?: string | null) {
  return useQuery<SavedWord[]>({
    queryKey: language
      ? queryKeys.savedWords.byLanguage(language)
      : queryKeys.savedWords.all(),
    queryFn: () => SavedWordService.getSavedWords(language),
    staleTime: SESSIONS_STALE_TIME, // Use constant: 5 minutes
  });
}

export function useSavedWord(id: number | null) {
  return useQuery<SavedWord>({
    queryKey: queryKeys.savedWords.detail(id!),
    queryFn: () => SavedWordService.getSavedWord(id!),
    enabled: id !== null && id > 0,
  });
}

export function useMatchingSavedWords(words: string[]) {
  return useQuery<SavedWordMatch[]>({
    queryKey: queryKeys.savedWords.matching(words),
    queryFn: () => SavedWordService.findMatchingWords(words),
    enabled: words.length > 0,
    staleTime: CHAT_HISTORY_STALE_TIME, // Use constant: 5 minutes
  });
}
