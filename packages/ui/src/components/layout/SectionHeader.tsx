import { ReactNode } from 'react';
import { Button, ButtonVariant } from '../form';

interface SectionHeaderProps {
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
 * Section header component with title and optional action button
 */
export default function SectionHeader({
  title,
  action,
  className = '',
}: SectionHeaderProps) {
  return (
    <div
      className={`flex items-center justify-between ${className}`}
    >
      <h3 className="text-base font-semibold text-text-secondary">{title}</h3>
      {action && (
        <Button
          onClick={action.onClick}
          disabled={action.disabled}
          variant={ButtonVariant.ICON}
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
