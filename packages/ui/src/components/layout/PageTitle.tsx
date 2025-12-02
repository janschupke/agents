import { ReactNode } from 'react';

interface PageTitleProps {
  children: ReactNode;
  className?: string;
}

/**
 * Page section title component (h2)
 * Used in PageHeader for page titles
 */
export default function PageTitle({ children, className = '' }: PageTitleProps) {
  return (
    <h2 className={`text-lg font-semibold text-text-secondary ${className}`}>
      {children}
    </h2>
  );
}
