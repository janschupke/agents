import { useState, useEffect } from 'react';
import {
  Card,
  ModalHeader,
  ModalFooter,
  Input,
  FormField,
  FormButton,
  Button,
} from '@openai/ui';
import { useTranslation, I18nNamespace } from '@openai/i18n';
import {
  useUpdateSavedWord,
  useDeleteSavedWord,
  useAddSentence,
  useRemoveSentence,
} from '../../../../hooks/mutations/use-saved-word-mutations';
import { SavedWord, SavedWordSentence } from '../../../../types/saved-word.types';

interface EditSavedWordModalProps {
  isOpen: boolean;
  onClose: () => void;
  word: SavedWord;
}

export default function EditSavedWordModal({
  isOpen,
  onClose,
  word,
}: EditSavedWordModalProps) {
  const { t } = useTranslation(I18nNamespace.CLIENT);
  const updateMutation = useUpdateSavedWord();
  const deleteMutation = useDeleteSavedWord();
  const addSentenceMutation = useAddSentence();
  const removeSentenceMutation = useRemoveSentence();

  const [translation, setTranslation] = useState(word.translation);
  const [sentences, setSentences] = useState<SavedWordSentence[]>(word.sentences || []);

  useEffect(() => {
    if (isOpen) {
      setTranslation(word.translation);
      setSentences(word.sentences || []);
    }
  }, [isOpen, word]);

  const isLoading =
    updateMutation.isPending ||
    deleteMutation.isPending ||
    addSentenceMutation.isPending ||
    removeSentenceMutation.isPending;

  const handleSave = async () => {
    if (!translation.trim()) {
      return;
    }

    try {
      await updateMutation.mutateAsync({
        id: word.id,
        data: { translation: translation.trim() },
      });
      onClose();
    } catch (error) {
      // Error is handled by mutation's onError handler (shows toast)
      // Don't close modal on error so user can retry
    }
  };

  const handleDelete = async () => {
    if (window.confirm(t('savedWords.confirmDelete'))) {
      try {
        await deleteMutation.mutateAsync(word.id);
        onClose();
      } catch (error) {
        // Error is handled by mutation's onError handler (shows toast)
        // Don't close modal on error so user can retry
      }
    }
  };

  const handleRemoveSentence = async (sentenceId: number) => {
    try {
      await removeSentenceMutation.mutateAsync({
        savedWordId: word.id,
        sentenceId,
      });
      setSentences((prev) => prev.filter((s) => s.id !== sentenceId));
    } catch (error) {
      // Error is handled by mutation's onError handler (shows toast)
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
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
        <Card
          variant="elevated"
          padding="none"
          className="w-full max-w-2xl m-4 max-h-[90vh] overflow-y-auto"
        >
          <ModalHeader
            title={t('savedWords.editWord')}
            onClose={onClose}
          />
          <div className="px-6 py-4 space-y-4">
            {/* Original Word (read-only) */}
            <FormField label={t('savedWords.originalWord')} labelFor="original-word">
              <Input
                id="original-word"
                type="text"
                value={word.originalWord}
                disabled
                className="w-full bg-background-secondary"
              />
            </FormField>

            {/* Pinyin (read-only) */}
            {word.pinyin && (
              <FormField label={t('savedWords.pinyin')} labelFor="pinyin">
                <Input
                  id="pinyin"
                  type="text"
                  value={word.pinyin}
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

            {/* Existing Sentences */}
            <FormField label={t('savedWords.sentences')} labelFor="sentences">
              <div className="space-y-2">
                {sentences.length === 0 ? (
                  <div className="text-sm text-text-secondary">
                    {t('savedWords.noSentences')}
                  </div>
                ) : (
                  sentences.map((sentence) => (
                    <div
                      key={sentence.id}
                      className="flex items-start gap-2 p-3 bg-background-secondary rounded"
                    >
                      <div className="flex-1 text-sm text-text-primary">
                        {sentence.sentence}
                      </div>
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => handleRemoveSentence(sentence.id)}
                        disabled={isLoading}
                        tooltip={t('common.delete')}
                      >
                        ×
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </FormField>
          </div>
          <ModalFooter>
            <Button
              type="button"
              onClick={handleDelete}
              disabled={isLoading}
              variant="danger"
            >
              {t('common.delete')}
            </Button>
            <div className="flex gap-2 ml-auto">
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
            </div>
          </ModalFooter>
        </Card>
      </div>
    </div>
  );
}
