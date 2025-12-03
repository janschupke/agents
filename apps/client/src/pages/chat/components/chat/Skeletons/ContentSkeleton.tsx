import { Skeleton, SkeletonMessage } from '@openai/ui';

/**
 * Loading skeleton for page content only
 */
export default function ContentSkeleton() {
  return (
    <div className="p-4">
      <Skeleton className="h-6 w-32 mb-4" />
      <div className="space-y-4">
        <SkeletonMessage />
        <SkeletonMessage />
        <SkeletonMessage />
      </div>
    </div>
  );
}
