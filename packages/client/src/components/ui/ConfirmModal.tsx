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
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
  };

  const confirmButtonClass =
    confirmVariant === 'danger'
      ? 'bg-red-600 hover:bg-red-700 text-white'
      : 'bg-primary text-text-inverse hover:bg-primary-hover';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={onClose}
    >
      <div
        className="bg-background border border-border w-full max-w-md m-4 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-text-secondary">{title}</h2>
        </div>
        <div className="px-6 py-4">
          <p className="text-sm text-text-primary">{message}</p>
        </div>
        <div className="px-6 py-4 border-t border-border flex justify-end gap-3">
          <button
            onClick={onClose}
            className="h-8 px-4 bg-background-tertiary text-text-primary border border-border rounded-md text-sm font-medium cursor-pointer transition-colors hover:bg-background-secondary"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            className={`h-8 px-4 border-none rounded-md text-sm font-medium cursor-pointer transition-colors ${confirmButtonClass}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
