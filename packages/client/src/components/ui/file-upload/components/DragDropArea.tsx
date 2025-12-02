interface DragDropAreaProps {
  isDragging: boolean;
  hasValue: boolean;
  onClick: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  children: React.ReactNode;
  className?: string;
}

/**
 * Reusable drag-and-drop area component
 */
export default function DragDropArea({
  isDragging,
  hasValue,
  onClick,
  onDragOver,
  onDragLeave,
  onDrop,
  children,
  className = '',
}: DragDropAreaProps) {
  return (
    <div
      onClick={onClick}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`
        relative border-2 border-dashed rounded-md cursor-pointer transition-colors
        ${
          isDragging
            ? 'border-primary bg-primary/5'
            : hasValue
              ? 'border-border hover:border-border-focus'
              : 'border-border-input hover:border-border-focus bg-background'
        }
        ${className}
      `}
    >
      {children}
    </div>
  );
}
