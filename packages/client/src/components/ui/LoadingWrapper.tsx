import { ReactNode } from 'react';
import Loading from './Loading.js';

interface LoadingWrapperProps {
  isLoading: boolean;
  loadingText?: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export default function LoadingWrapper({
  isLoading,
  loadingText = 'Loading...',
  children,
  fallback,
}: LoadingWrapperProps) {
  if (isLoading) {
    return fallback || <Loading variant="full-page" text={loadingText} />;
  }

  return <>{children}</>;
}
