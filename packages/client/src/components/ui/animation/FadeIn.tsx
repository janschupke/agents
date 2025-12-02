import { ReactNode } from 'react';

interface FadeInProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

/**
 * Wrapper component that applies fade-in animation to its children
 * Preserves flex positioning by not adding extra wrapper styles
 */
export default function FadeIn({ children, className = '', delay = 0 }: FadeInProps) {
  return (
    <div
      className={`animate-fade-in ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
