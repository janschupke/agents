import { ReactNode } from 'react';

interface FormFieldProps {
  label?: string | ReactNode;
  labelFor?: string;
  error?: string | null;
  touched?: boolean;
  hint?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
  showError?: boolean;
}

/**
 * Reusable form field wrapper with label, error message, and hint
 */
export default function FormField({
  label,
  labelFor,
  error,
  touched = false,
  hint,
  required = false,
  children,
  className = '',
  showError = true,
}: FormFieldProps) {
  const hasError = touched && error && showError;

  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={labelFor}
          className="block text-sm font-medium text-text-secondary mb-1.5"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      {children}
      {hasError && <p className="text-xs text-red-600 mt-1">{error}</p>}
      {hint && !hasError && (
        <p className="text-xs text-text-tertiary mt-1">{hint}</p>
      )}
    </div>
  );
}
