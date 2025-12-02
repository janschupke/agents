import { WordTranslation, MessageRole } from '../../types/chat.types.js';
import WordTooltip from './WordTooltip';
import MarkdownContent from './MarkdownContent';

interface TranslatableMessageContentProps {
  content: string;
  wordTranslations?: WordTranslation[];
  role: MessageRole;
}

export default function TranslatableMessageContent({
  content,
  wordTranslations = [],
  role,
}: TranslatableMessageContentProps) {
  // If no word translations or not assistant message, render normally
  if (role !== MessageRole.ASSISTANT || wordTranslations.length === 0) {
    return <MarkdownContent content={content} />;
  }

  // Create a map of word translations by original word
  // Note: This is simplified - in practice, you may need to match by position/index
  const translationMap = new Map<string, string>();
  wordTranslations.forEach((wt) => {
    translationMap.set(wt.originalWord.toLowerCase(), wt.translation);
  });

  // Split content into words while preserving markdown structure
  // This is a simplified approach - you may need more sophisticated parsing
  // to handle markdown properly
  const words = content.split(/(\s+)/);
  
  return (
    <span className="markdown-wrapper">
      {words.map((word, index) => {
        const cleanWord = word.trim().toLowerCase();
        const translation = translationMap.get(cleanWord);
        
        if (translation && word.trim()) {
          return (
            <WordTooltip key={index} translation={translation}>
              {word}
            </WordTooltip>
          );
        }
        
        return <span key={index}>{word}</span>;
      })}
    </span>
  );
}
