import { forwardRef } from 'react';
import { ComponentSize, getInputSizeClasses } from '../size-system';

interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  className?: string;
  size?: ComponentSize;
}

/**
 * Simple input component with consistent styling
 * Uses unified size system to match Button/FormButton heights
 */
const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', size = 'md', ...props }, ref) => {
    const sizeClasses = getInputSizeClasses(size);
    return (
      <input
        ref={ref}
        {...props}
        className={`w-full ${sizeClasses} border border-border-input rounded-md text-text-primary bg-background focus:outline-none focus:border-border-focus disabled:bg-disabled-bg disabled:cursor-not-allowed ${className}`}
      />
    );
  }
);

Input.displayName = 'Input';

export default Input;
