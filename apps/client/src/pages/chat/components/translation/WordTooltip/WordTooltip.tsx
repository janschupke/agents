import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const wordRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (showTooltip && wordRef.current) {
      const rect = wordRef.current.getBoundingClientRect();
      setTooltipPosition({
        x: rect.left + rect.width / 2,
        y: rect.top - 10,
      });
    }
  }, [showTooltip]);

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

  // Render tooltip in a portal to avoid DOM nesting issues (div inside p)
  const tooltipElement =
    showTooltip && hasContent ? (
      <div
        className="fixed z-50 px-3 py-2 text-xs bg-background-inverse text-text-inverse rounded shadow-lg pointer-events-none min-w-[120px]"
        style={{
          left: `${tooltipPosition.x}px`,
          top: `${tooltipPosition.y}px`,
          transform: 'translate(-50%, -100%)',
        }}
      >
        <div className="font-semibold mb-1">{originalWord}</div>
        {displayPinyin && (
          <div className="text-text-tertiary mb-1 text-[10px]">
            {displayPinyin}
          </div>
        )}
        {translation && <div className="text-text-inverse">{translation}</div>}
        <div
          className="absolute top-full left-1/2 transform -translate-x-1/2"
          style={{
            borderLeft: '4px solid transparent',
            borderRight: '4px solid transparent',
            borderTop: '4px solid rgb(17, 24, 39)',
          }}
        />
      </div>
    ) : null;

  return (
    <>
      <span
        ref={wordRef}
        className={`transition-colors duration-150 inline ${
          isSaved
            ? 'bg-yellow-200 bg-opacity-60 dark:bg-yellow-800 dark:bg-opacity-40'
            : 'hover:bg-yellow-200 hover:bg-opacity-50 dark:hover:bg-yellow-800 dark:hover:bg-opacity-30'
        } ${onClick ? 'cursor-pointer' : 'cursor-help'}`}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
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
      {tooltipElement &&
        typeof document !== 'undefined' &&
        createPortal(tooltipElement, document.body)}
    </>
  );
}
