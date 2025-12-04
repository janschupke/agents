import { ReactNode } from 'react';
import PageTitle from '../PageTitle';

interface PageHeaderProps {
  title?: string;
  leftContent?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

/**
 * Unified header component for page sections.
 * Provides consistent header styling across all views.
 * Supports either title (centered/left) or custom leftContent.
 */
export default function PageHeader({
  title,
  leftContent,
  actions,
  className = '',
}: PageHeaderProps) {
  return (
    <div
      className={`px-5 py-3 bg-background border-b border-border flex items-center justify-between ${className}`}
    >
      <div className="flex items-center">
        {leftContent || (title && <PageTitle>{title}</PageTitle>)}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
