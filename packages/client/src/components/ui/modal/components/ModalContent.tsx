interface ModalContentProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Reusable modal content wrapper
 */
export default function ModalContent({ children, className = '' }: ModalContentProps) {
  return (
    <div className={`px-6 py-4 ${className}`}>
      {children}
    </div>
  );
}

