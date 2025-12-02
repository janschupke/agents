import { ReactNode } from 'react';
import { Button, ButtonVariant } from '../form';

interface SidebarItemAction {
  icon: ReactNode;
  onClick: () => void;
  variant?: 'default' | 'danger';
  tooltip?: string;
}

interface SidebarItemProps {
  isSelected: boolean;
  primaryText: string | ReactNode;
  secondaryText?: string | ReactNode;
  onClick: () => void;
  actions?: SidebarItemAction[];
  className?: string;
}

/**
 * Reusable sidebar list item with selection state and action buttons
 */
export default function SidebarItem({
  isSelected,
  primaryText,
  secondaryText,
  onClick,
  actions,
  className = '',
}: SidebarItemProps) {
  return (
    <div
      className={`group flex items-center border-b border-border transition-colors ${
        isSelected
          ? 'bg-primary text-text-inverse'
          : 'bg-background text-text-primary hover:bg-background-tertiary'
      } ${className}`}
    >
      <button
        onClick={onClick}
        className={`flex-1 px-3 py-2 text-left transition-colors min-w-0 bg-transparent ${
          isSelected ? 'text-text-inverse' : ''
        }`}
      >
        <div className="text-sm font-medium truncate">{primaryText}</div>
        {secondaryText && (
          <div
            className={`text-xs mt-0.5 truncate ${
              isSelected ? 'text-text-inverse opacity-80' : 'text-text-tertiary'
            }`}
          >
            {secondaryText}
          </div>
        )}
      </button>
      {actions && actions.length > 0 && (
        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
          {actions.map((action, index) => (
            <Button
              key={index}
              onClick={(e) => {
                e?.stopPropagation();
                action.onClick();
              }}
              variant={ButtonVariant.ICON}
              size="sm"
              className={`px-2 py-1 ${
                isSelected
                  ? action.variant === 'danger'
                    ? 'text-text-inverse hover:opacity-100'
                    : 'text-text-inverse hover:opacity-80'
                  : action.variant === 'danger'
                    ? 'text-text-tertiary hover:text-red-500'
                    : 'text-text-tertiary hover:text-text-primary'
              }`}
              tooltip={action.tooltip}
            >
              {action.icon}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
