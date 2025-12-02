import { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

/**
 * Simple input component with consistent styling
 */
const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', ...props }, ref) => {
    return (
      <input
        ref={ref}
        {...props}
        className={`w-full h-8 px-3 border border-border-input rounded-md text-sm text-text-primary bg-background focus:outline-none focus:border-border-focus disabled:bg-disabled-bg disabled:cursor-not-allowed ${className}`}
      />
    );
  }
);

Input.displayName = 'Input';

export default Input;

