import { PageContainer } from '../../../../components/ui/layout';
import { Skeleton, SkeletonList, SkeletonMessage } from '../../../../components/ui/feedback';

export default function ChatLoadingState() {
  return (
    <PageContainer>
      <div className="flex h-full">
        <div className="w-56 border-r border-border p-3">
          <Skeleton className="h-6 w-20 mb-3" />
          <SkeletonList count={5} />
        </div>
        <div className="flex-1 p-4">
          <Skeleton className="h-6 w-32 mb-4" />
          <div className="space-y-4">
            <SkeletonMessage />
            <SkeletonMessage />
            <SkeletonMessage />
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
