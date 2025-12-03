import { WordTranslation } from '../../../../../types/chat.types';
import { SavedWordMatch } from '../../../../../types/saved-word.types';
import WordTooltip from '../WordTooltip/WordTooltip';

interface WordPresenterProps {
  text: string;
  wordTranslations: WordTranslation[];
  savedWordMatches?: Map<string, SavedWordMatch>; // Map of word (lowercase) -> saved word data
  onWordClick?: (
    word: string,
    translation: string,
    pinyin: string | null,
    savedWordId?: number,
    sentence?: string
  ) => void;
}

/**
 * Reusable component that presents text with word-level translations
 * Highlights words with translations and shows tooltips on hover
 * Handles languages with and without spaces (e.g., Chinese, Japanese)
 * Supports saved word highlighting and click handlers
 */
export default function WordPresenter({
  text,
  wordTranslations,
  savedWordMatches,
  onWordClick,
}: WordPresenterProps) {
  // If no translations, return plain text
  if (!wordTranslations || wordTranslations.length === 0) {
    return <>{text}</>;
  }

  // Create a map of original words to their translations
  // Sort by length (longest first) for greedy matching
  const sortedWords = [...wordTranslations].sort(
    (a, b) => b.originalWord.length - a.originalWord.length
  );

  // Build parts array by matching words in the text (greedy longest match)
  const parts: Array<{
    text: string;
    translation?: string;
    savedWordMatch?: SavedWordMatch;
  }> = [];
  let i = 0;
  const textLength = text.length;

  while (i < textLength) {
    let matched = false;

    // Try to find the longest matching word starting at position i
    for (const word of sortedWords) {
      const originalWord = word.originalWord;
      const wordLength = originalWord.length;

      // Check if this word matches at the current position (case-sensitive match)
      if (
        i + wordLength <= textLength &&
        text.substring(i, i + wordLength) === originalWord
      ) {
        // Check for saved word match (case-insensitive)
        const lowerKey = originalWord.toLowerCase();
        const savedMatch = savedWordMatches?.get(lowerKey);

        // Found a match - add it
        parts.push({
          text: originalWord,
          translation: word.translation,
          savedWordMatch: savedMatch,
        });
        i += wordLength;
        matched = true;
        break; // Use the first (longest) match found
      }
    }

    if (!matched) {
      // No match found - add one character
      parts.push({
        text: text[i],
      });
      i++;
    }
  }

  // Render the parts - all inline to preserve text flow
  return (
    <>
      {parts.map((part, index) => {
        if (!part.translation) {
          return (
            <span key={index} className="inline">
              {part.text}
            </span>
          );
        }

        const savedMatch = part.savedWordMatch;
        const pinyin = savedMatch?.pinyin || undefined;

        // Find sentence context from word translations
        const wordTranslation = wordTranslations.find(
          (wt) => wt.originalWord === part.text
        );
        const sentenceContext = wordTranslation?.sentenceContext;

        return (
          <WordTooltip
            key={index}
            translation={part.translation}
            pinyin={pinyin}
            originalWord={part.text}
            savedWordId={savedMatch?.savedWordId}
            onClick={
              onWordClick
                ? () =>
                    onWordClick(
                      part.text,
                      part.translation!,
                      pinyin || null,
                      savedMatch?.savedWordId,
                      sentenceContext
                    )
                : undefined
            }
          >
            {part.text}
          </WordTooltip>
        );
      })}
    </>
  );
}
