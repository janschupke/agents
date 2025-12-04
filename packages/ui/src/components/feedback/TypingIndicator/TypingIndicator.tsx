interface TypingIndicatorProps {
  className?: string;
  dotClassName?: string;
}

/**
 * Reusable typing indicator component with animated pulsating dots
 */
export default function TypingIndicator({
  className = '',
  dotClassName = '',
}: TypingIndicatorProps) {
  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <div
        className={`w-2 h-2 rounded-full bg-current animate-typing-dot animate-typing-dot-delay-1 ${dotClassName}`}
      />
      <div
        className={`w-2 h-2 rounded-full bg-current animate-typing-dot animate-typing-dot-delay-2 ${dotClassName}`}
      />
      <div
        className={`w-2 h-2 rounded-full bg-current animate-typing-dot animate-typing-dot-delay-3 ${dotClassName}`}
      />
    </div>
  );
}
