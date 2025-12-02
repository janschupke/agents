import { forwardRef } from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  className?: string;
}

/**
 * Simple textarea component with consistent styling
 */
const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = '', ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        {...props}
        className={`w-full px-3 py-2 border border-border-input rounded-md text-sm text-text-primary bg-background focus:outline-none focus:border-border-focus resize-none ${className}`}
      />
    );
  }
);

Textarea.displayName = 'Textarea';

export default Textarea;
