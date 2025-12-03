import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface WordTooltipProps {
  translation?: string;
  pinyin?: string | null;
  originalWord: string;
  savedWordId?: number; // If word is already saved
  onClick?: () => void;
  children: React.ReactNode;
}

export default function WordTooltip({
  translation,
  pinyin,
  originalWord,
  savedWordId,
  onClick,
  children,
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

  const hasContent = translation || pinyin;
  const isSaved = savedWordId !== undefined;

  // Always show highlighting for saved words, even without translation
  if (!hasContent && !onClick && !isSaved) {
    return <>{children}</>;
  }

  // Render tooltip in a portal to avoid DOM nesting issues (div inside p)
  const tooltipElement = showTooltip && hasContent ? (
    <div
      className="fixed z-50 px-3 py-2 text-xs bg-gray-900 text-white rounded shadow-lg pointer-events-none min-w-[120px]"
      style={{
        left: `${tooltipPosition.x}px`,
        top: `${tooltipPosition.y}px`,
        transform: 'translate(-50%, -100%)',
      }}
    >
      <div className="font-semibold mb-1">{originalWord}</div>
      {pinyin && (
        <div className="text-gray-300 mb-1 text-[10px]">{pinyin}</div>
      )}
      {translation && <div className="text-gray-100">{translation}</div>}
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
