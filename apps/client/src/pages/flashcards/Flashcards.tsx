import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Container,
  PageHeader,
  PageContent,
  Card,
  CardFlip,
  FormField,
} from '@openai/ui';
import { useTranslation, I18nNamespace } from '@openai/i18n';
import { useSavedWords } from '../../hooks/queries/use-saved-words';
import { LanguageFormattingService } from '../../services/language-formatting/language-formatting.service';
import { LANGUAGE_OPTIONS } from '../../constants/language.constants';

const FLIP_ANIMATION_DURATION_MS = 600;

export default function Flashcards() {
  const { t } = useTranslation(I18nNamespace.CLIENT);
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const { data: savedWords = [], isLoading } = useSavedWords(selectedLanguage);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [frontWordIndex, setFrontWordIndex] = useState(0);
  const [backWordIndex, setBackWordIndex] = useState(0);
  const transitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Get formatting config for selected language
  const formattingConfig = useMemo(
    () => LanguageFormattingService.getFormattingConfig(selectedLanguage),
    [selectedLanguage]
  );

  // Filter words that have valid content
  const validWords = useMemo(() => {
    return savedWords.filter(
      (word) => word.originalWord && word.originalWord.trim().length > 0
    );
  }, [savedWords]);

  // Get front word (shown when card is not flipped)
  const frontWord = useMemo(() => {
    if (validWords.length === 0) return null;
    return validWords[frontWordIndex % validWords.length];
  }, [validWords, frontWordIndex]);

  // Get back word (shown when card is flipped - keeps old word until flip completes)
  const backWord = useMemo(() => {
    if (validWords.length === 0) return null;
    return validWords[backWordIndex % validWords.length];
  }, [validWords, backWordIndex]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, []);

  const handleCardAction = useCallback(() => {
    if (isTransitioning) {
      // Ignore clicks during transition
      return;
    }

    if (!isFlipped) {
      // First action: flip the card to show answer
      // Set back word to current front word
      setBackWordIndex(frontWordIndex);
      setIsFlipped(true);
    } else {
      // Subsequent action: change word immediately, then flip back
      // New word appears on front as card flips back
      setIsTransitioning(true);
      const nextIndex = (currentIndex + 1) % validWords.length;
      setCurrentIndex(nextIndex);
      setFrontWordIndex(nextIndex);
      setIsFlipped(false);

      // Clear any existing timeout
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }

      // Wait for flip-back animation to complete before allowing next interaction
      transitionTimeoutRef.current = setTimeout(() => {
        setIsTransitioning(false);
        transitionTimeoutRef.current = null;
      }, FLIP_ANIMATION_DURATION_MS);
    }
  }, [
    isFlipped,
    isTransitioning,
    currentIndex,
    frontWordIndex,
    validWords.length,
  ]);

  const handleCardClick = useCallback(() => {
    handleCardAction();
  }, [handleCardAction]);

  // Handle keyboard events
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleCardAction();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleCardAction]);

  if (isLoading) {
    return (
      <Container>
        <PageHeader title={t('flashcards.title')} />
        <PageContent>
          <Card variant="outlined" padding="lg">
            <div className="text-center py-8 text-text-secondary">
              {t('common.loading')}
            </div>
          </Card>
        </PageContent>
      </Container>
    );
  }

  if (validWords.length === 0) {
    return (
      <Container>
        <PageHeader title={t('flashcards.title')} />
        <PageContent>
          <Card variant="outlined" padding="lg">
            <div className="text-center py-8">
              <p className="text-text-primary text-lg mb-2">
                {t('flashcards.noWords')}
              </p>
              <p className="text-text-secondary">
                {t('flashcards.noWordsDescription')}
              </p>
            </div>
          </Card>
        </PageContent>
      </Container>
    );
  }

  return (
    <Container>
      <PageHeader
        title={t('flashcards.title')}
        actions={
          <FormField
            label={t('flashcards.selectLanguage')}
            hint={t('flashcards.selectLanguageDescription')}
          >
            <select
              value={selectedLanguage || ''}
              onChange={(e) => setSelectedLanguage(e.target.value || null)}
              className="w-full px-3 py-2 border border-border-input rounded-md text-text-primary bg-background focus:outline-none focus:border-border-focus disabled:bg-disabled-bg disabled:cursor-not-allowed"
            >
              <option value="">{t('flashcards.allLanguages')}</option>
              {LANGUAGE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FormField>
        }
      />
      <PageContent>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-full max-w-2xl">
            <div
              onClick={handleCardClick}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleCardClick();
                }
              }}
              role="button"
              tabIndex={0}
              className="cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg"
            >
              <CardFlip
                isFlipped={isFlipped}
                front={
                  <Card
                    variant="outlined"
                    padding="lg"
                    className="h-64 flex items-center justify-center"
                  >
                    <div className="text-center">
                      <div className="text-6xl font-bold text-text-primary mb-4">
                        {frontWord?.originalWord}
                      </div>
                      <p className="text-text-secondary text-sm">
                        {t('flashcards.clickToFlip')}
                      </p>
                    </div>
                  </Card>
                }
                back={
                  <Card
                    variant="outlined"
                    padding="lg"
                    className="h-64 flex items-center justify-center"
                  >
                    <div className="text-center space-y-4">
                      <div className="text-4xl font-bold text-text-primary mb-2">
                        {backWord?.originalWord}
                      </div>
                      {backWord?.pinyin && formattingConfig.showPinyin && (
                        <div className="text-2xl text-text-secondary mb-2">
                          {backWord.pinyin}
                        </div>
                      )}
                      <div className="text-xl text-text-primary">
                        {backWord?.translation}
                      </div>
                      <p className="text-text-secondary text-sm mt-4">
                        {t('flashcards.clickForNext')}
                      </p>
                    </div>
                  </Card>
                }
                className="w-full h-64"
              />
            </div>
          </div>
        </div>
      </PageContent>
    </Container>
  );
}
