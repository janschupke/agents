import { IconClose } from '../../Icons';
import { Button } from '../../form';

interface DialogHeaderProps {
  children: React.ReactNode;
  onClose?: () => void;
}

/**
 * Dialog header component
 */
export default function DialogHeader({
  children,
  onClose,
}: DialogHeaderProps) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-border">
      {children}
      {onClose && (
        <Button
          onClick={onClose}
          variant="ghost"
          size="sm"
          className="p-0"
          tooltip="Close"
        >
          <IconClose className="w-5 h-5" />
        </Button>
      )}
    </div>
  );
}
