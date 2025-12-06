import { Tooltip } from '@openai/ui';
import { LanguageFormattingService } from '../../../../../services/language-formatting/language-formatting.service';

interface WordTooltipProps {
  translation?: string;
  pinyin?: string | null;
  originalWord: string;
  savedWordId?: number; // If word is already saved
  onClick?: () => void;
  children: React.ReactNode;
  language?: string | null; // Agent language
}

export default function WordTooltip({
  translation,
  pinyin,
  originalWord,
  savedWordId,
  onClick,
  children,
  language,
}: WordTooltipProps) {
  // Only show pinyin if language formatting config says so
  const shouldShowPinyin = LanguageFormattingService.shouldShowPinyin(
    language ?? null
  );
  const displayPinyin = shouldShowPinyin ? pinyin : null;

  const hasContent = translation || displayPinyin;
  const isSaved = savedWordId !== undefined;

  // Always show highlighting for saved words, even without translation
  if (!hasContent && !onClick && !isSaved) {
    return <>{children}</>;
  }

  const tooltipContent = hasContent ? (
    <>
      <div className="font-semibold mb-1">{originalWord}</div>
      {displayPinyin && (
        <div className="text-text-inverse opacity-70 mb-1 text-[10px]">
          {displayPinyin}
        </div>
      )}
      {translation && <div className="text-text-inverse">{translation}</div>}
    </>
  ) : null;

  const wrapperClassName = `transition-colors duration-150 inline ${
    isSaved
      ? 'bg-yellow-200 bg-opacity-60 dark:bg-yellow-800 dark:bg-opacity-40'
      : 'hover:bg-yellow-200 hover:bg-opacity-50 dark:hover:bg-yellow-800 dark:hover:bg-opacity-30'
  } ${onClick ? 'cursor-pointer' : 'cursor-help'}`;

  if (hasContent) {
    return (
      <Tooltip
        content={tooltipContent}
        position="top"
        wrapperClassName={wrapperClassName}
      >
        <span
          onClick={(e) => {
            if (onClick) {
              e.preventDefault();
              e.stopPropagation();
              onClick();
            }
          }}
        >
          {children}
        </span>
      </Tooltip>
    );
  }

  // No tooltip, but still show highlighting and click handler for saved words
  return (
    <span
      className={wrapperClassName}
      onClick={(e) => {
        if (onClick) {
          e.preventDefault();
          e.stopPropagation();
          onClick();
        }
      }}
    >
      {children}
    </span>
  );
}
