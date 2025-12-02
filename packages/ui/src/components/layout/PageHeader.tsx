import { ReactNode } from 'react';
import PageTitle from './PageTitle';

interface PageHeaderProps {
  title: string;
  actions?: ReactNode;
  className?: string;
}

/**
 * Unified header component for page sections.
 * Provides consistent header styling across all views.
 */
export default function PageHeader({
  title,
  actions,
  className = '',
}: PageHeaderProps) {
  return (
    <div
      className={`px-5 py-3 bg-background border-b border-border flex items-center justify-between ${className}`}
    >
      <PageTitle>{title}</PageTitle>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
