interface ModalBackdropProps {
  onClose: () => void;
  children: React.ReactNode;
}

/**
 * Reusable modal backdrop/overlay component
 */
export default function ModalBackdrop({ onClose, children }: ModalBackdropProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={onClose}
    >
      {children}
    </div>
  );
}
