import { forwardRef } from 'react';
import { ComponentSize, getInputSizeClasses } from '../size-system';

export interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  className?: string;
  size?: ComponentSize;
}

/**
 * Simple select component with consistent styling
 * Uses unified size system to match Button/Input heights
 */
const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', size = 'md', ...props }, ref) => {
    const sizeClasses = getInputSizeClasses(size);
    return (
      <select
        ref={ref}
        {...props}
        className={`w-full ${sizeClasses} border border-border-input rounded-md text-text-primary bg-background focus:outline-none focus:border-border-focus disabled:bg-disabled-bg disabled:cursor-not-allowed ${className}`}
      />
    );
  }
);

Select.displayName = 'Select';

export default Select;
