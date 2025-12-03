import { PageContainer, Skeleton } from '@openai/ui';
import TopNavigation from './TopNavigation';
import { Footer } from '@openai/ui';
import { memo } from 'react';

// Memoized Footer component to prevent re-renders
const AppFooter = memo(Footer);

/**
 * Loading state component for route transitions
 * Used as Suspense fallback when lazy loading routes
 */
export default function PageLoadingState() {
  return (
    <PageContainer>
      <TopNavigation />
      <main className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Skeleton className="w-8 h-8 rounded-full" />
          <Skeleton className="h-4 w-24" />
        </div>
      </main>
      <AppFooter />
    </PageContainer>
  );
}
