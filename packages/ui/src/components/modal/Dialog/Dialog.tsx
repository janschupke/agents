import { useEffect } from 'react';
import ModalBackdrop from '../components/ModalBackdrop';
import ModalContainer from '../components/ModalContainer';

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  maxWidth?: string;
}

/**
 * Dialog component for displaying modal dialogs
 */
export default function Dialog({
  open,
  onOpenChange,
  children,
  maxWidth = 'max-w-md',
}: DialogProps) {
  // Handle keyboard events
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onOpenChange(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <ModalBackdrop onClose={() => onOpenChange(false)}>
      <ModalContainer maxWidth={maxWidth} onClick={(e) => e.stopPropagation()}>
        {children}
      </ModalContainer>
    </ModalBackdrop>
  );
}
