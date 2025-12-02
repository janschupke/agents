import { ButtonType, ButtonVariant } from './form-types';
import { IconLoader } from '../Icons';
import { getButtonVariantStyles } from './hooks/use-button-variant';

interface ButtonProps {
  type?: ButtonType;
  loading?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  variant?: ButtonVariant;
  tooltip?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'h-7 px-3 text-xs',
  md: 'h-8 px-4 text-sm',
  lg: 'h-10 px-6 text-base',
};

/**
 * Generic button component with variants and loading states
 */
export default function Button({
  type = ButtonType.BUTTON,
  loading = false,
  disabled = false,
  children,
  onClick,
  variant = ButtonVariant.PRIMARY,
  tooltip,
  className = '',
  size = 'md',
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const variantStyles = getButtonVariantStyles(variant);
  const disabledStyles = isDisabled
    ? 'opacity-50 cursor-not-allowed'
    : 'cursor-pointer transition-colors';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      title={tooltip || (loading ? 'Loading...' : undefined)}
      className={`rounded-md font-medium flex items-center justify-center gap-2 ${sizeClasses[size]} ${variantStyles} ${disabledStyles} ${className}`}
    >
      {loading && <IconLoader className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
}
