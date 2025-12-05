import { IconUpload } from '../../Icons';
import { useFileUpload } from '../../file-upload/hooks/use-file-upload';
import DragDropArea from '../../file-upload/components/DragDropArea';

export interface AvatarInputProps {
  value: string | null;
  onChange: (value: string | null) => void;
  accept?: string;
  maxSizeMB?: number;
  disabled?: boolean;
  label?: string;
  className?: string;
}

/**
 * Avatar input component with drag-and-drop support
 * Generic reusable component for both client and admin
 */
export default function AvatarInput({
  value,
  onChange,
  accept = 'image/*',
  maxSizeMB = 5,
  disabled = false,
  label,
  className = '',
}: AvatarInputProps) {
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
    <div className={`flex-shrink-0 w-24 ${className}`}>
      <label className="block text-sm font-medium text-text-secondary mb-1.5">
        {label || 'Avatar'}
      </label>
      <DragDropArea
        isDragging={isDragging}
        hasValue={!!value}
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className="w-24 h-24 flex items-center justify-center relative"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileInputChange}
          style={{ display: 'none' }}
          disabled={disabled}
        />

        {value ? (
          <>
            <div className="relative w-full h-full overflow-hidden rounded-md">
              <img
                src={value}
                alt="Avatar"
                className="w-full h-full object-cover"
                style={{
                  maxWidth: '96px',
                  maxHeight: '96px',
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            </div>
            {!disabled && (
              <button
                type="button"
                onClick={handleRemove}
                className="absolute -top-2 -right-2 w-5 h-5 bg-red-600 text-white rounded-full flex items-center justify-center hover:bg-red-700 transition-colors text-xs z-10"
                title="Remove avatar"
              >
                ×
              </button>
            )}
          </>
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
