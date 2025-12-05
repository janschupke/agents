interface DialogTitleProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Dialog title component
 */
export default function DialogTitle({
  children,
  className = '',
}: DialogTitleProps) {
  return (
    <h2 className={`text-lg font-semibold text-text-secondary ${className}`}>
      {children}
    </h2>
  );
}
