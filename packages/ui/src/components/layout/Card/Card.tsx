import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outlined' | 'elevated';
}

const paddingClasses = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

const variantClasses = {
  default: 'bg-background',
  outlined: 'bg-background border border-border',
  elevated: 'bg-background shadow-md',
};

/**
 * Reusable card component for grouping content
 */
export default function Card({
  children,
  className = '',
  padding = 'md',
  variant = 'default',
}: CardProps) {
  return (
    <div
      className={`rounded-lg ${paddingClasses[padding]} ${variantClasses[variant]} ${className}`}
    >
      {children}
    </div>
  );
}
