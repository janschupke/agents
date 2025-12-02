import { useRef } from 'react';

interface ValidatedInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string | null;
  touched?: boolean;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  showError?: boolean;
}

/**
 * Input component with validation error display
 */
export default function ValidatedInput({
  error,
  touched = false,
  onBlur,
  showError = true,
  className = '',
  disabled,
  ...props
}: ValidatedInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (onBlur) {
      onBlur(e);
    }
  };

  const hasError = touched && error && showError;

  return (
    <div className="w-full">
      <input
        ref={inputRef}
        {...props}
        disabled={disabled}
        onBlur={handleBlur}
        className={`w-full h-8 px-3 border rounded-md text-sm text-text-primary bg-background focus:outline-none focus:border-border-focus disabled:bg-disabled-bg disabled:cursor-not-allowed ${
          hasError ? 'border-red-500' : 'border-border-input'
        } ${className}`}
      />
      {hasError && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}
