import { ButtonVariant } from '../form-types';

interface ButtonVariantStyles {
  [key: string]: string;
}

/**
 * Returns the CSS classes for a button variant
 */
export function getButtonVariantStyles(variant: ButtonVariant): string {
  const variantStyles: ButtonVariantStyles = {
    [ButtonVariant.PRIMARY]:
      'bg-primary text-text-inverse hover:bg-primary-hover',
    [ButtonVariant.SECONDARY]:
      'bg-background text-text-primary border border-border hover:bg-background-tertiary',
    [ButtonVariant.DANGER]: 'bg-red-600 text-white hover:bg-red-700',
  };

  return variantStyles[variant] || variantStyles[ButtonVariant.PRIMARY];
}
