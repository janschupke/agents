import { useState, useEffect } from 'react';
import {
  useFormValidation,
  savedWordFormValidationSchema,
} from '@openai/utils';
import {
  useCreateSavedWord,
  useUpdateSavedWord,
} from '../../../../../../hooks/mutations/use-saved-word-mutations';
import { useSavedWord } from '../../../../../../hooks/queries/use-saved-words';
import { SavedWordSentence } from '../../../../../../types/saved-word.types';

export interface SavedWordFormValues extends Record<string, unknown> {
  translation: string;
  pinyin?: string;
}

interface UseSavedWordFormOptions {
  isOpen: boolean;
  initialTranslation: string;
  initialPinyin?: string | null;
  sentence?: string;
  messageId?: number;
  agentId?: number | null;
  sessionId?: number | null;
  savedWordId?: number;
  originalWord: string;
  onClose: () => void;
}

interface UseSavedWordFormReturn {
  values: SavedWordFormValues;
  errors: Partial<Record<keyof SavedWordFormValues, string | null>>;
  touched: Partial<Record<keyof SavedWordFormValues, boolean>>;
  existingSentences: SavedWordSentence[];
  isLoading: boolean;
  isEditing: boolean;
  setValue: (field: keyof SavedWordFormValues, value: string) => void;
  setTouched: (field: keyof SavedWordFormValues) => void;
  handleSave: () => Promise<void>;
  handleKeyDown: (e: React.KeyboardEvent) => void;
}

/**
 * Manages saved word form state and validation
 */
export function useSavedWordForm({
  isOpen,
  initialTranslation,
  initialPinyin,
  sentence,
  messageId,
  agentId,
  sessionId,
  savedWordId,
  originalWord,
  onClose,
}: UseSavedWordFormOptions): UseSavedWordFormReturn {
  const createMutation = useCreateSavedWord();
  const updateMutation = useUpdateSavedWord();
  const { data: existingWord } = useSavedWord(savedWordId || null);

  const [existingSentences, setExistingSentences] = useState<
    SavedWordSentence[]
  >([]);

  const { values, errors, touched, setValue, setTouched, validateAll, reset } =
    useFormValidation<SavedWordFormValues>(
      savedWordFormValidationSchema,
      {
        translation: initialTranslation,
        pinyin: initialPinyin || undefined,
      }
    );

  // Reset form when modal opens/closes or initial values change
  useEffect(() => {
    if (isOpen) {
      setValue('translation', initialTranslation);
      setValue('pinyin', initialPinyin || undefined);
      if (existingWord) {
        setExistingSentences(existingWord.sentences || []);
      } else {
        setExistingSentences([]);
      }
    } else {
      reset();
      setExistingSentences([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialTranslation, initialPinyin, existingWord]);

  const isEditing = savedWordId !== undefined;
  const isLoading = createMutation.isPending || updateMutation.isPending;

  const handleSave = async () => {
    const validation = validateAll();
    if (!validation.isValid) {
      return;
    }

    try {
      if (isEditing && savedWordId) {
        // Check if translation changed
        if (values.translation.trim() !== initialTranslation.trim()) {
          await updateMutation.mutateAsync({
            id: savedWordId,
            data: { translation: values.translation.trim() },
          });
        }
        // If sentence provided and word exists, add it
        if (sentence && existingWord) {
          // Check if sentence already exists
          const sentenceExists = existingWord.sentences.some(
            (s) => s.sentence === sentence
          );
          if (!sentenceExists) {
            // Note: We'd need useAddSentence hook here, but for now just update translation
            // Sentence addition can be done from edit modal
          }
        }
      } else {
        await createMutation.mutateAsync({
          originalWord,
          translation: values.translation.trim(),
          pinyin: values.pinyin || undefined,
          agentId: agentId || undefined,
          sessionId: sessionId || undefined,
          sentence: sentence || undefined,
          messageId: messageId || undefined,
        });
      }
      onClose();
    } catch (error) {
      // Error is handled by mutation's onError handler (shows toast)
      // Don't close modal on error so user can retry
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && !isLoading) {
      void handleSave();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return {
    values,
    errors,
    touched,
    existingSentences,
    isLoading,
    isEditing,
    setValue,
    setTouched,
    handleSave,
    handleKeyDown,
  };
}
