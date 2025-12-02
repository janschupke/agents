import { ReactNode } from 'react';

interface DropdownTransitionProps {
  show: boolean;
  children: ReactNode;
  className?: string;
}

/**
 * Wrapper component for dropdown menus with fade-in animation
 */
export default function DropdownTransition({
  show,
  children,
  className = '',
}: DropdownTransitionProps) {
  if (!show) return null;

  return <div className={`animate-fade-in ${className}`}>{children}</div>;
}
