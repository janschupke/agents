import { ReactNode } from 'react';

interface SidebarProps {
  children: ReactNode;
  className?: string;
  width?: 'sm' | 'md' | 'lg' | number;
}

const widthClasses = {
  sm: 'w-48',
  md: 'w-56',
  lg: 'w-64',
};

/**
 * Sidebar container component with sharp-edge design
 */
export default function Sidebar({
  children,
  className = '',
  width = 'md',
}: SidebarProps) {
  const widthClass = typeof width === 'number' ? '' : widthClasses[width];
  const widthStyle = typeof width === 'number' ? { width: `${width}px` } : {};

  return (
    <div
      className={`flex flex-col self-stretch bg-background-tertiary border-r border-border overflow-hidden ${widthClass} ${className}`}
      style={widthStyle}
    >
      {children}
    </div>
  );
}
