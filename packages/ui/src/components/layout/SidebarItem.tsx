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
  onClick: () => void;
  actions?: SidebarItemAction[];
  className?: string;
  // New API
  title?: string | ReactNode;
  description?: string | ReactNode;
  children?: ReactNode;
  // Legacy API (for backward compatibility)
  primaryText?: string | ReactNode;
  secondaryText?: string | ReactNode;
}

/**
 * Reusable sidebar list item with selection state and action buttons.
 * Supports both new API (title/description) and legacy API (primaryText/secondaryText) for backward compatibility.
 * If children is provided, renders custom content instead of default title/description layout.
 */
export default function SidebarItem({
  isSelected,
  onClick,
  actions,
  className = '',
  title,
  description,
  children,
  // Legacy props for backward compatibility
  primaryText,
  secondaryText,
}: SidebarItemProps) {
  // Use new API if provided, otherwise fall back to legacy API
  const displayTitle = title ?? primaryText;
  const displayDescription = description ?? secondaryText;

  // If children provided, render custom content
  if (children) {
    return (
      <div
        className={`group border-b border-border transition-colors ${
          isSelected
            ? 'bg-primary text-text-inverse'
            : 'bg-background text-text-primary hover:bg-background-tertiary'
        } ${className}`}
      >
        {children}
      </div>
    );
  }

  // Default rendering with title/description
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
        {displayTitle && (
          <div className="text-sm font-medium truncate">{displayTitle}</div>
        )}
        {displayDescription && (
          <div
            className={`text-xs mt-0.5 truncate ${
              isSelected ? 'text-text-inverse opacity-80' : 'text-text-tertiary'
            }`}
          >
            {displayDescription}
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
