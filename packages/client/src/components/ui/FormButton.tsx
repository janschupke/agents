import { ButtonType, ButtonVariant } from './form-types.js';
import { IconLoader } from './Icons.js';

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

  const variantStyles = {
    [ButtonVariant.PRIMARY]: 'bg-primary text-text-inverse hover:bg-primary-hover',
    [ButtonVariant.SECONDARY]: 'bg-background text-text-primary border border-border hover:bg-background-tertiary',
    [ButtonVariant.DANGER]: 'bg-red-600 text-white hover:bg-red-700',
  };

  const disabledStyles = isDisabled
    ? 'opacity-50 cursor-not-allowed'
    : 'cursor-pointer transition-colors';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      title={tooltip || (loading ? 'Loading...' : undefined)}
      className={`h-8 px-4 rounded-md text-sm font-medium flex items-center justify-center gap-2 ${variantStyles[variant]} ${disabledStyles} ${className}`}
    >
      {loading && <IconLoader className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
}
