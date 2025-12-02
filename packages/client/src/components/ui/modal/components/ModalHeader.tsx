import { IconClose } from '../../Icons';

interface ModalHeaderProps {
  title: string;
  onClose: () => void;
}

/**
 * Reusable modal header component
 */
export default function ModalHeader({ title, onClose }: ModalHeaderProps) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-border">
      <h2 className="text-lg font-semibold text-text-secondary">{title}</h2>
      <button
        onClick={onClose}
        className="text-text-tertiary hover:text-text-primary transition-colors"
        aria-label="Close"
      >
        <IconClose className="w-5 h-5" />
      </button>
    </div>
  );
}
