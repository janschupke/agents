import { useState, useEffect } from 'react';
import {
  Card,
  ModalHeader,
  ModalFooter,
  Input,
  FormField,
  FormButton,
} from '@openai/ui';
import { useTranslation, I18nNamespace } from '@openai/i18n';
import { useCreateSavedWord, useUpdateSavedWord } from '../../../../../hooks/mutations/use-saved-word-mutations';
import { useSavedWord } from '../../../../../hooks/queries/use-saved-words';
import { SavedWordSentence } from '../../../../../types/saved-word.types';

interface SavedWordModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalWord: string;
  translation: string;
  pinyin?: string | null;
  sentence?: string;
  messageId?: number;
  agentId?: number | null;
  sessionId?: number | null;
  savedWordId?: number; // If editing existing word
}

export default function SavedWordModal({
  isOpen,
  onClose,
  originalWord,
  translation: initialTranslation,
  pinyin: initialPinyin,
  sentence,
  messageId,
  agentId,
  sessionId,
  savedWordId,
}: SavedWordModalProps) {
  const { t } = useTranslation(I18nNamespace.CLIENT);
  const createMutation = useCreateSavedWord();
  const updateMutation = useUpdateSavedWord();
  const { data: existingWord } = useSavedWord(savedWordId || null);

  const [translation, setTranslation] = useState(initialTranslation);
  const [existingSentences, setExistingSentences] = useState<SavedWordSentence[]>([]);

  useEffect(() => {
    if (isOpen) {
      setTranslation(initialTranslation);
      if (existingWord) {
        setExistingSentences(existingWord.sentences || []);
      } else {
        setExistingSentences([]);
      }
    }
  }, [isOpen, initialTranslation, existingWord]);

  const isEditing = savedWordId !== undefined;
  const isLoading = createMutation.isPending || updateMutation.isPending;

  const handleSave = async () => {
    if (!translation.trim()) {
      return;
    }

    try {
      if (isEditing && savedWordId) {
        // Check if translation changed
        if (translation.trim() !== initialTranslation.trim()) {
          await updateMutation.mutateAsync({
            id: savedWordId,
            data: { translation: translation.trim() },
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
          translation: translation.trim(),
          pinyin: initialPinyin || undefined,
          agentId: agentId || undefined,
          sessionId: sessionId || undefined,
          sentence: sentence || undefined,
          messageId: messageId || undefined,
        });
      }
      onClose();
    } catch (error) {
      console.error('Failed to save word:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && !isLoading) {
      handleSave();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={onClose}
    >
      <div onClick={(e) => e.stopPropagation()}>
        <Card variant="elevated" padding="none" className="w-full max-w-lg m-4 max-h-[90vh] overflow-y-auto">
          <ModalHeader
            title={isEditing ? t('savedWords.editWord') : t('savedWords.saveWord')}
            onClose={onClose}
          />
          <div className="px-6 py-4 space-y-4">
            {/* Original Word (read-only) */}
            <FormField label={t('savedWords.originalWord')} labelFor="original-word">
              <Input
                id="original-word"
                type="text"
                value={originalWord}
                disabled
                className="w-full bg-background-secondary"
              />
            </FormField>

            {/* Pinyin (read-only if exists) */}
            {initialPinyin && (
              <FormField label={t('savedWords.pinyin')} labelFor="pinyin">
                <Input
                  id="pinyin"
                  type="text"
                  value={initialPinyin}
                  disabled
                  className="w-full bg-background-secondary"
                />
              </FormField>
            )}

            {/* Translation (editable) */}
            <FormField
              label={t('savedWords.translation')}
              labelFor="translation"
              required
            >
              <Input
                id="translation"
                type="text"
                value={translation}
                onChange={(e) => setTranslation(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                className="w-full"
                placeholder={t('savedWords.enterTranslation')}
                autoFocus
              />
            </FormField>

            {/* Current Sentence Context */}
            {sentence && (
              <FormField label={t('savedWords.sentenceContext')} labelFor="sentence">
                <div className="p-3 bg-background-secondary rounded text-sm text-text-secondary">
                  {sentence}
                </div>
              </FormField>
            )}

            {/* Existing Sentences (if editing) */}
            {isEditing && existingSentences.length > 0 && (
              <FormField label={t('savedWords.existingSentences')} labelFor="sentences">
                <div className="space-y-2">
                  {existingSentences.map((sent) => (
                    <div
                      key={sent.id}
                      className="p-2 bg-background-secondary rounded text-sm text-text-secondary"
                    >
                      {sent.sentence}
                    </div>
                  ))}
                </div>
              </FormField>
            )}
          </div>
          <ModalFooter>
            <FormButton
              type="button"
              onClick={onClose}
              disabled={isLoading}
              variant="secondary"
            >
              {t('common.cancel')}
            </FormButton>
            <FormButton
              type="button"
              onClick={handleSave}
              loading={isLoading}
              disabled={isLoading || !translation.trim()}
              variant="primary"
            >
              {t('common.save')}
            </FormButton>
          </ModalFooter>
        </Card>
      </div>
    </div>
  );
}
