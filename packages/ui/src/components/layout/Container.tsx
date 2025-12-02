import { ReactNode } from 'react';

interface ContainerProps {
  children: ReactNode;
  className?: string;
}

/**
 * Content container component for page sections.
 * Wraps PageHeader and PageContent components.
 * Purely structural - no padding, no animations.
 * Route transitions handled by RouteTransitionWrapper in App.tsx
 */
export default function Container({ 
  children, 
  className = '',
}: ContainerProps) {
  return (
    <div className={`flex flex-col flex-1 overflow-hidden ${className}`}>
      {children}
    </div>
  );
}
