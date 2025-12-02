import { ReactNode } from 'react';
import Loading from './Loading';

interface LoadingWrapperProps {
  isLoading: boolean;
  loadingText?: string;
  children: ReactNode;
  fallback?: ReactNode;
}

function LoadingWrapper({
  isLoading,
  loadingText,
  children,
  fallback,
}: LoadingWrapperProps) {
  if (isLoading) {
    return fallback || <Loading variant="full-page" text={loadingText} />;
  }

  return <>{children}</>;
}
