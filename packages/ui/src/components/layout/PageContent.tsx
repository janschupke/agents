import { ReactNode, useEffect, useState, useRef } from 'react';

interface PageContentProps {
  children: ReactNode;
  className?: string;
  animateOnChange?: string | number | null;
  enableAnimation?: boolean;
}

/**
 * Scrollable content area component.
 * Provides padding and overflow handling for page content.
 * Supports optional fade-in animation when animateOnChange value changes.
 */
export default function PageContent({ 
  children, 
  className = '',
  animateOnChange,
  enableAnimation = false,
}: PageContentProps) {
  const [animationKey, setAnimationKey] = useState(0);
  const previousValueRef = useRef(animateOnChange);

  useEffect(() => {
    if (enableAnimation && animateOnChange !== previousValueRef.current) {
      if (animateOnChange !== null && animateOnChange !== undefined) {
        setAnimationKey(prev => prev + 1);
      }
      previousValueRef.current = animateOnChange;
    }
  }, [animateOnChange, enableAnimation]);

  return (
    <div
      key={enableAnimation ? animationKey : undefined}
      className={`flex-1 overflow-y-auto p-8 ${enableAnimation ? 'animate-fade-in' : ''} ${className}`}
    >
      {children}
    </div>
  );
}
