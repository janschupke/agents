import { IconUpload } from '../Icons';
import { useFileUpload } from './hooks/use-file-upload';
import DragDropArea from './components/DragDropArea';

interface AvatarPickerProps {
  value: string | null;
  onChange: (value: string | null) => void;
  accept?: string;
  maxSizeMB?: number;
}

/**
 * Avatar picker component with drag-and-drop support
 */
export default function AvatarPicker({
  value,
  onChange,
  accept = 'image/*',
  maxSizeMB = 5,
}: AvatarPickerProps) {
  const {
    fileInputRef,
    isDragging,
    error,
    handleFileInputChange,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleClick,
    handleRemove,
  } = useFileUpload({ accept, maxSizeMB, onChange });

  return (
    <div className="flex-shrink-0">
      <label className="block text-sm font-medium text-text-secondary mb-1.5">
        Avatar
      </label>
      <DragDropArea
        isDragging={isDragging}
        hasValue={!!value}
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className="w-24 h-24 flex items-center justify-center"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileInputChange}
          className="hidden"
        />

        {value ? (
          <div className="relative w-full h-full">
            <img
              src={value}
              alt="Avatar"
              className="w-full h-full object-cover rounded-md"
            />
            <button
              type="button"
              onClick={handleRemove}
              className="absolute -top-2 -right-2 w-5 h-5 bg-red-600 text-white rounded-full flex items-center justify-center hover:bg-red-700 transition-colors text-xs"
              title="Remove avatar"
            >
              ×
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-2">
            <IconUpload className="w-5 h-5 text-text-tertiary mb-1" />
            <span className="text-xs text-text-tertiary">Upload</span>
          </div>
        )}
      </DragDropArea>
      {error && <p className="text-xs text-red-600 mt-1.5">{error}</p>}
    </div>
  );
}
