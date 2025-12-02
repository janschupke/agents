import { ReactNode } from 'react';

interface PageContainerProps {
  children: ReactNode;
  className?: string;
}

/**
 * Unified container component for all page views.
 * Full-width container without margins or shadows, connected to header/footer.
 * Uses flex column layout to properly contain TopNavigation, content, and Footer.
 */
export default function PageContainer({
  children,
  className = '',
}: PageContainerProps) {
  return (
    <div className={`w-full h-screen flex flex-col bg-background overflow-hidden ${className}`}>
      {children}
    </div>
  );
}
