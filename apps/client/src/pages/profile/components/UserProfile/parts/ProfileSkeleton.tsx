import { Skeleton } from '@openai/ui';

/**
 * Loading skeleton for user profile page
 */
export default function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      {/* Profile Header Skeleton */}
      <div className="flex items-center gap-6">
        <Skeleton className="w-24 h-24 rounded-full" />
        <div className="flex-1">
          <Skeleton className="h-6 w-32 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>

      {/* User Details Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Skeleton className="h-4 w-16 mb-2" />
          <Skeleton className="h-5 w-full" />
        </div>
        <div>
          <Skeleton className="h-4 w-20 mb-2" />
          <Skeleton className="h-5 w-full" />
        </div>
        <div>
          <Skeleton className="h-4 w-20 mb-2" />
          <Skeleton className="h-5 w-full" />
        </div>
        <div>
          <Skeleton className="h-4 w-16 mb-2" />
          <Skeleton className="h-5 w-full" />
        </div>
        <div>
          <Skeleton className="h-4 w-12 mb-2" />
          <div className="flex gap-2 mt-1">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        </div>
      </div>

      {/* API Key Section Skeleton */}
      <div>
        <Skeleton className="h-5 w-32 mb-4" />
        <Skeleton className="h-10 w-full mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>
    </div>
  );
}
