import { ButtonType, ButtonVariant, isValidButtonVariant } from './form-types';
import { IconLoader } from '../Icons';
import { ComponentSize, getButtonSizeClasses } from './size-system';

interface FormButtonProps {
  type?: ButtonType;
  loading?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  variant?: ButtonVariant;
  tooltip?: string;
  className?: string;
  size?: ComponentSize;
}

/**
 * Get variant styles directly in component (no helper function)
 */
function getVariantStyles(variant: ButtonVariant = 'primary'): string {
  const variantStyles: Record<ButtonVariant, string> = {
    primary:
      'bg-primary text-text-inverse hover:bg-primary-hover disabled:hover:bg-primary',
    secondary:
      'bg-background text-text-primary border border-border hover:bg-background-tertiary hover:border-border-focus disabled:hover:bg-background disabled:hover:border-border',
    danger:
      'bg-red-600 text-white hover:bg-red-700 disabled:hover:bg-red-600',
    icon: 'bg-transparent text-text-tertiary hover:text-text-primary hover:bg-background-tertiary border-none disabled:hover:bg-transparent disabled:hover:text-text-tertiary',
    ghost: 'bg-transparent text-text-primary hover:bg-background-tertiary border-none disabled:hover:bg-transparent',
    'ghost-inverse':
      'bg-transparent text-text-inverse hover:bg-white/10 border-none disabled:hover:bg-transparent',
    'icon-compact':
      'bg-transparent text-text-tertiary hover:text-text-primary hover:bg-background-tertiary border-none p-1 disabled:hover:bg-transparent disabled:hover:text-text-tertiary',
    'message-bubble':
      'bg-transparent text-current hover:bg-black/10 dark:hover:bg-white/10 border-none disabled:hover:bg-transparent',
  };

  return variantStyles[variant] || variantStyles.primary;
}

export default function FormButton({
  type = 'button',
  loading = false,
  disabled = false,
  children,
  onClick,
  variant = 'primary',
  tooltip,
  className = '',
  size = 'md',
}: FormButtonProps) {
  // Validate variant
  const validVariant: ButtonVariant = isValidButtonVariant(variant)
    ? variant
    : 'primary';

  const isDisabled = disabled || loading;
  const variantStyles = getVariantStyles(validVariant);
  const sizeClasses = getButtonSizeClasses(size);
  const disabledStyles = isDisabled
    ? 'opacity-50 cursor-not-allowed'
    : 'cursor-pointer transition-colors';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      title={tooltip || (loading ? 'Loading...' : undefined)}
      className={`rounded-md font-medium flex items-center justify-center gap-2 ${sizeClasses} ${variantStyles} ${disabledStyles} ${className}`}
    >
      {loading && <IconLoader className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
}
