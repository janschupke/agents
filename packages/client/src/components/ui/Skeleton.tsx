// Skeleton loading components
import React from 'react';

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-background-tertiary rounded ${className}`} />
  );
}

export function SkeletonText({ lines = 1, className = "" }: { lines?: number; className?: string }) {
  return (
    <div className={className}>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} className="h-4 mb-2" />
      ))}
    </div>
  );
}

export function SkeletonButton({ className = "" }: { className?: string }) {
  return <Skeleton className={`h-8 rounded-md ${className}`} />;
}

export function SkeletonSidebarItem({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 p-2 ${className}`}>
      <Skeleton className="w-8 h-8 rounded" />
      <div className="flex-1">
        <Skeleton className="h-3 w-3/4 mb-2" />
        <Skeleton className="h-2 w-1/2" />
      </div>
    </div>
  );
}

export function SkeletonMessage({ className = "" }: { className?: string }) {
  return (
    <div className={`flex gap-2 ${className}`}>
      <Skeleton className="w-8 h-8 rounded-full" />
      <div className="flex-1">
        <Skeleton className="h-4 w-1/4 mb-2" />
        <Skeleton className="h-16 w-full rounded-lg" />
      </div>
    </div>
  );
}

export function SkeletonList({ count = 3, className = "" }: { count?: number; className?: string }) {
  return (
    <div className={className}>
      {Array.from({ length: count }, (_, i) => (
        <SkeletonSidebarItem key={i} className="mb-2" />
      ))}
    </div>
  );
}
