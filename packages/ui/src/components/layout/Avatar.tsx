interface AvatarProps {
  src?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  borderWidth?: 'none' | 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'w-5 h-5 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-24 h-24 text-3xl',
  xl: 'w-32 h-32 text-4xl',
};

const borderClasses = {
  none: '',
  sm: 'border',
  md: 'border-4',
  lg: 'border-8',
};

/**
 * Avatar component with image or initial fallback
 */
export default function Avatar({
  src,
  name,
  size = 'md',
  className = '',
  borderWidth = 'sm',
}: AvatarProps) {
  const initial = name.charAt(0).toUpperCase();
  const sizeClass = sizeClasses[size];
  const borderClass = borderWidth !== 'none' ? borderClasses[borderWidth] : '';

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`${sizeClass} rounded-full object-cover ${borderClass} border-border ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} rounded-full bg-primary flex items-center justify-center text-text-inverse font-semibold ${borderClass} border-border ${className}`}
    >
      {initial}
    </div>
  );
}
