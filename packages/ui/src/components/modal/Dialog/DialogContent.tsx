interface DialogContentProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Dialog content wrapper
 */
export default function DialogContent({
  children,
  className = '',
}: DialogContentProps) {
  return <div className={className}>{children}</div>;
}
