import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  actions?: ReactNode;
  className?: string;
}

/**
 * Unified header component for page sections.
 * Provides consistent header styling across all views.
 */
export default function PageHeader({ title, actions, className = '' }: PageHeaderProps) {
  return (
    <div
      className={`px-5 py-3 bg-background border-b border-border flex items-center justify-between ${className}`}
    >
      <h2 className="text-lg font-semibold text-text-secondary">{title}</h2>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
