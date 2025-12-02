import { ReactNode } from 'react';

interface SidebarContentProps {
  children: ReactNode;
  className?: string;
  loading?: boolean;
  empty?: boolean;
  emptyMessage?: ReactNode;
  loadingComponent?: ReactNode;
}

/**
 * Sidebar scrollable content area with loading and empty states
 */
export default function SidebarContent({
  children,
  className = '',
  loading = false,
  empty = false,
  emptyMessage,
  loadingComponent,
}: SidebarContentProps) {
  return (
    <div className={`flex-1 overflow-y-auto ${className}`}>
      {loading && loadingComponent}
      {!loading && empty && emptyMessage && (
        <div className="p-4 text-text-tertiary text-center text-sm">
          {emptyMessage}
        </div>
      )}
      {!loading && !empty && children}
    </div>
  );
}
