import { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title?: string;
  message?: string | ReactNode;
  className?: string;
}

/**
 * Empty state component with icon and message
 */
export default function EmptyState({
  icon,
  title,
  message,
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`flex-1 flex items-center justify-center ${className}`}>
      <div className="text-center">
        {icon && <div className="mb-4 mx-auto">{icon}</div>}
        {title && <p className="text-text-secondary mb-2">{title}</p>}
        {message && (
          typeof message === 'string' ? (
            <p className="text-sm text-text-tertiary">{message}</p>
          ) : (
            <div className="text-sm text-text-tertiary">{message}</div>
          )
        )}
      </div>
    </div>
  );
}
