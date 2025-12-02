import { ButtonType, ButtonVariant } from './form-types.js';
import { IconLoader } from '../Icons.js';
import { getButtonVariantStyles } from './hooks/use-button-variant';

interface FormButtonProps {
  type?: ButtonType;
  loading?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  variant?: ButtonVariant;
  tooltip?: string;
  className?: string;
}

export default function FormButton({
  type = ButtonType.BUTTON,
  loading = false,
  disabled = false,
  children,
  onClick,
  variant = ButtonVariant.PRIMARY,
  tooltip,
  className = '',
}: FormButtonProps) {
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
      className={`h-8 px-4 rounded-md text-sm font-medium flex items-center justify-center gap-2 ${variantStyles} ${disabledStyles} ${className}`}
    >
      {loading && <IconLoader className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
}
