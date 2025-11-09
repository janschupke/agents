import { ReactNode } from 'react';

interface PageContainerProps {
  children: ReactNode;
  className?: string;
}

/**
 * Unified container component for all page views.
 * Full-width container without margins or shadows, connected to header/footer.
 */
export default function PageContainer({ children, className = '' }: PageContainerProps) {
  return (
    <div className={`w-full h-full bg-background overflow-hidden ${className}`}>
      {children}
    </div>
  );
}
