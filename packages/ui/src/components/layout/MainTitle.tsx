import { ReactNode } from 'react';

interface MainTitleProps {
  children: ReactNode;
  className?: string;
}

/**
 * Main application title component (h1)
 * Used in TopNavigation for the app title
 */
export default function MainTitle({ children, className = '' }: MainTitleProps) {
  return (
    <h1 className={`text-xl font-semibold text-text-primary ${className}`}>
      {children}
    </h1>
  );
}
