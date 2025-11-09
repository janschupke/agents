import { ReactNode } from 'react';

interface PageContainerProps {
  children: ReactNode;
  className?: string;
}

/**
 * Unified container component for all page views.
 * Ensures consistent styling and full viewport space usage.
 */
export default function PageContainer({ children, className = '' }: PageContainerProps) {
  return (
    <div className={`w-full h-full bg-background-secondary rounded-lg shadow-lg overflow-hidden ${className}`}>
      {children}
    </div>
  );
}
