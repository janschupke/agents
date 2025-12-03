export type ButtonType = 'submit' | 'button';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'danger'
  | 'icon'
  | 'ghost'
  | 'ghost-inverse'
  | 'icon-compact'
  | 'message-bubble';

/**
 * Valid button variants for validation
 */
export const VALID_BUTTON_VARIANTS: ButtonVariant[] = [
  'primary',
  'secondary',
  'danger',
  'icon',
  'ghost',
  'ghost-inverse',
  'icon-compact',
  'message-bubble',
];

/**
 * Validates if a string is a valid button variant
 */
export function isValidButtonVariant(variant: string): variant is ButtonVariant {
  return VALID_BUTTON_VARIANTS.includes(variant as ButtonVariant);
}
