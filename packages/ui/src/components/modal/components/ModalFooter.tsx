interface ModalFooterProps {
  children: React.ReactNode;
}

/**
 * Reusable modal footer component
 */
export default function ModalFooter({ children }: ModalFooterProps) {
  return (
    <div className="px-6 py-4 border-t border-border flex justify-end gap-3">
      {children}
    </div>
  );
}
