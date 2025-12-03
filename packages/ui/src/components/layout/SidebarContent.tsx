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
 * CRITICAL: Never show loading if children exist - data is already loaded
 * This prevents sidebar from disappearing when navigating/clicking items
 */
export default function SidebarContent({
  children,
  className = '',
  loading = false,
  empty = false,
  emptyMessage,
  loadingComponent,
}: SidebarContentProps) {
  // If we have children, we have data - never show loading
  // This is the universal fix: if data exists, don't show loading skeleton
  const hasChildren = Boolean(children);
  const shouldShowLoading = loading && !hasChildren;
  const shouldShowEmpty = !shouldShowLoading && empty && !hasChildren;

  return (
    <div className={`flex-1 overflow-y-auto ${className}`}>
      {shouldShowLoading && loadingComponent}
      {shouldShowEmpty && emptyMessage && (
        <div className="p-4 text-text-tertiary text-center text-sm">
          {emptyMessage}
        </div>
      )}
      {hasChildren && children}
    </div>
  );
}
