import { useEffect } from 'react';
import ModalBackdrop from './components/ModalBackdrop';
import ModalContainer from './components/ModalContainer';
import ModalHeader from './components/ModalHeader';
import ModalContent from './components/ModalContent';
import ModalFooter from './components/ModalFooter';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'danger' | 'primary';
}

/**
 * Confirmation modal component with keyboard support
 */
export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'primary',
}: ConfirmModalProps) {
  // Handle keyboard events
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        onConfirm();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, onConfirm]);

  if (!isOpen) return null;

  const confirmButtonClass =
    confirmVariant === 'danger'
      ? 'bg-red-600 hover:bg-red-700 text-white'
      : 'bg-primary text-text-inverse hover:bg-primary-hover';

  return (
    <ModalBackdrop onClose={onClose}>
      <ModalContainer onClick={(e) => e.stopPropagation()}>
        <ModalHeader title={title} onClose={onClose} />
        <ModalContent>
          <p className="text-sm text-text-primary">{message}</p>
        </ModalContent>
        <ModalFooter>
          <button
            onClick={onClose}
            className="h-8 px-4 bg-background-tertiary text-text-primary border border-border rounded-md text-sm font-medium cursor-pointer transition-colors hover:bg-background-secondary"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`h-8 px-4 border-none rounded-md text-sm font-medium cursor-pointer transition-colors ${confirmButtonClass}`}
          >
            {confirmText}
          </button>
        </ModalFooter>
      </ModalContainer>
    </ModalBackdrop>
  );
}
