import { Skeleton } from '../../../../components/ui/feedback';

/**
 * Loading skeleton for agent configuration form
 */
export default function BotConfigFormSkeleton() {
  return (
    <div className="space-y-5">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <Skeleton className="h-4 w-16 mb-1.5" />
          <Skeleton className="h-24 w-24 rounded-md" />
        </div>
        <div className="flex-1">
          <Skeleton className="h-4 w-20 mb-1.5" />
          <Skeleton className="h-8 w-full" />
        </div>
      </div>
      <div>
        <Skeleton className="h-4 w-24 mb-1.5" />
        <Skeleton className="h-20 w-full" />
      </div>
      <div>
        <Skeleton className="h-4 w-32 mb-1.5" />
        <Skeleton className="h-2 w-full" />
      </div>
      <div>
        <Skeleton className="h-4 w-28 mb-1.5" />
        <Skeleton className="h-24 w-full" />
      </div>
      <div>
        <Skeleton className="h-4 w-32 mb-1.5" />
        <Skeleton className="h-10 w-full mb-2" />
        <Skeleton className="h-8 w-full" />
      </div>
    </div>
  );
}
