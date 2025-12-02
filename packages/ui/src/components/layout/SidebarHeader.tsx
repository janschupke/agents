import { ReactNode } from 'react';
import { Button, ButtonVariant } from '../form';

interface SidebarHeaderProps {
  title: string;
  action?: {
    icon: ReactNode;
    onClick: () => void;
    disabled?: boolean;
    tooltip?: string;
  };
  className?: string;
}

/**
 * Sidebar header component with title and optional action button
 */
export default function SidebarHeader({
  title,
  action,
  className = '',
}: SidebarHeaderProps) {
  return (
    <div
      className={`px-3 py-2.5 bg-background border-b border-border flex items-center justify-between ${className}`}
    >
      <h3 className="text-sm font-semibold text-text-secondary">{title}</h3>
      {action && (
        <Button
          onClick={action.onClick}
          disabled={action.disabled}
          variant={ButtonVariant.SECONDARY}
          size="sm"
          className="h-6 w-6 p-0"
          tooltip={action.tooltip}
        >
          {action.icon}
        </Button>
      )}
    </div>
  );
}
