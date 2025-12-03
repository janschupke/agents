import { Skeleton } from '@openai/ui';

/**
 * Loading skeleton for container only
 * Maintains Container's flex structure to preserve layout
 */
export default function ContainerSkeleton() {
  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex items-center justify-center flex-1">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
    </div>
  );
}
