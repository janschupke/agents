import { Skeleton, SkeletonList } from '@openai/ui';

/**
 * Loading skeleton for sidebar only
 * Maintains Sidebar's flex structure to preserve layout
 */
export default function SidebarSkeleton() {
  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex-1 overflow-y-auto p-3">
        <Skeleton className="h-6 w-20 mb-3" />
        <SkeletonList count={5} />
      </div>
    </div>
  );
}
