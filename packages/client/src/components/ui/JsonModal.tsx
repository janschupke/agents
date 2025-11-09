import { IconClose } from './Icons';

interface JsonModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  data: unknown;
}

export default function JsonModal({ isOpen, onClose, title, data }: JsonModalProps) {
  if (!isOpen) return null;

  const jsonString = JSON.stringify(data, null, 2);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={onClose}
    >
      <div 
        className="bg-background border border-border w-full max-w-4xl max-h-[90vh] flex flex-col m-4"
        onClick={(e) => e.stopPropagation()}
      >
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
        <div className="flex-1 overflow-auto p-6">
          <pre className="text-xs text-text-primary font-mono bg-background p-4 rounded border border-border whitespace-pre-wrap break-words">
            {jsonString}
          </pre>
        </div>
        <div className="px-6 py-4 border-t border-border flex justify-end">
          <button
            onClick={onClose}
            className="h-8 px-4 bg-primary text-text-inverse border-none rounded-md text-sm font-medium cursor-pointer transition-colors hover:bg-primary-hover"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
