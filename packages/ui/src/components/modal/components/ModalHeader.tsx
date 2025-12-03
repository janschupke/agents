import { IconClose } from '../../Icons';
import { Button } from '../../form';

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
      <Button
        onClick={onClose}
        variant="ghost"
        size="sm"
        className="p-0"
        tooltip="Close"
      >
        <IconClose className="w-5 h-5" />
      </Button>
    </div>
  );
}
