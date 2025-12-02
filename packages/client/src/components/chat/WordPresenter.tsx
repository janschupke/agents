import { WordTranslation } from '../../types/chat.types.js';
import WordTooltip from './WordTooltip';

interface WordPresenterProps {
  text: string;
  wordTranslations: WordTranslation[];
}

/**
 * Reusable component that presents text with word-level translations
 * Highlights words with translations and shows tooltips on hover
 * Handles languages with and without spaces (e.g., Chinese, Japanese)
 */
export default function WordPresenter({
  text,
  wordTranslations,
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
  const parts: Array<{ text: string; translation?: string }> = [];
  let i = 0;
  const textLength = text.length;

  while (i < textLength) {
    let matched = false;

    // Try to find the longest matching word starting at position i
    for (const word of sortedWords) {
      const originalWord = word.originalWord;
      const wordLength = originalWord.length;
      
      // Check if this word matches at the current position
      if (
        i + wordLength <= textLength &&
        text.substring(i, i + wordLength) === originalWord
      ) {
        // Found a match - add it
        parts.push({
          text: originalWord,
          translation: word.translation,
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
          return <span key={index} className="inline">{part.text}</span>;
        }

        return (
          <WordTooltip key={index} word={part.text} translation={part.translation}>
            {part.text}
          </WordTooltip>
        );
      })}
    </>
  );
}
