import { useState, useRef, useEffect } from 'react';

interface WordTooltipProps {
  word: string;
  translation?: string;
  children: React.ReactNode;
}

export default function WordTooltip({
  word,
  translation,
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

  if (!translation) {
    return <>{children}</>;
  }

  return (
    <>
      <span
        ref={wordRef}
        className="cursor-help transition-colors duration-150 hover:bg-yellow-200 hover:bg-opacity-50 dark:hover:bg-yellow-800 dark:hover:bg-opacity-30 rounded px-0.5"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {children}
      </span>
      {showTooltip && (
        <div
          className="fixed z-50 px-2 py-1 text-xs bg-gray-900 text-white rounded shadow-lg pointer-events-none"
          style={{
            left: `${tooltipPosition.x}px`,
            top: `${tooltipPosition.y}px`,
            transform: 'translate(-50%, -100%)',
          }}
        >
          {translation}
          <div
            className="absolute top-full left-1/2 transform -translate-x-1/2"
            style={{
              borderLeft: '4px solid transparent',
              borderRight: '4px solid transparent',
              borderTop: '4px solid rgb(17, 24, 39)',
            }}
          />
        </div>
      )}
    </>
  );
}
