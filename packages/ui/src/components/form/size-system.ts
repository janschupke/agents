/**
 * Unified size system for form components
 * Ensures consistent sizing across Button, FormButton, Input, and icons
 */

export type ComponentSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface SizeClasses {
  height: string;
  paddingX: string;
  textSize: string;
  iconSize: string;
}

export const SIZE_CLASSES: Record<ComponentSize, SizeClasses> = {
  xs: {
    height: 'h-5',
    paddingX: 'px-2',
    textSize: 'text-xs',
    iconSize: 'w-3.5 h-3.5',
  },
  sm: {
    height: 'h-7',
    paddingX: 'px-3',
    textSize: 'text-xs',
    iconSize: 'w-4 h-4',
  },
  md: {
    height: 'h-8',
    paddingX: 'px-4',
    textSize: 'text-sm',
    iconSize: 'w-4 h-4',
  },
  lg: {
    height: 'h-10',
    paddingX: 'px-6',
    textSize: 'text-base',
    iconSize: 'w-5 h-5',
  },
  xl: {
    height: 'h-12',
    paddingX: 'px-8',
    textSize: 'text-lg',
    iconSize: 'w-6 h-6',
  },
};

/**
 * Get size classes for a component
 */
export function getSizeClasses(size: ComponentSize = 'md'): SizeClasses {
  return SIZE_CLASSES[size];
}

/**
 * Get combined size classes string for buttons
 */
export function getButtonSizeClasses(size: ComponentSize = 'md'): string {
  const classes = SIZE_CLASSES[size];
  return `${classes.height} ${classes.paddingX} ${classes.textSize}`;
}

/**
 * Get combined size classes string for inputs
 */
export function getInputSizeClasses(size: ComponentSize = 'md'): string {
  const classes = SIZE_CLASSES[size];
  return `${classes.height} ${classes.paddingX} ${classes.textSize}`;
}
