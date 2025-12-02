import { ReactNode } from 'react';

interface FadeTransitionProps {
  show: boolean;
  children: ReactNode;
  className?: string;
  duration?: 'normal' | 'fast';
}

/**
 * Wrapper component that conditionally shows/hides children with fade transition
 * Always renders children to allow smooth transitions
 */
export default function FadeTransition({
  show,
  children,
  className = '',
  duration = 'normal',
}: FadeTransitionProps) {
  const transitionClass =
    duration === 'fast' ? 'transition-fade-fast' : 'transition-fade';

  return (
    <div
      className={`${transitionClass} ${className}`}
      style={{
        opacity: show ? 1 : 0,
        visibility: show ? 'visible' : 'hidden',
        pointerEvents: show ? 'auto' : 'none',
        maxHeight: show ? 'none' : 0,
        overflow: show ? 'visible' : 'hidden',
      }}
    >
      {children}
    </div>
  );
}
