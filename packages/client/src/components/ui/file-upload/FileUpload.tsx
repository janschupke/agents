import { IconImage, IconUpload } from '../../Icons';
import { useFileUpload } from './hooks/use-file-upload';
import DragDropArea from './components/DragDropArea';

interface FileUploadProps {
  value: string | null;
  onChange: (value: string | null) => void;
  accept?: string;
  maxSizeMB?: number;
  label?: string;
  description?: string;
}

/**
 * File upload component with drag-and-drop support
 */
export default function FileUpload({
  value,
  onChange,
  accept = 'image/*',
  maxSizeMB = 5,
  label = 'Upload Image',
  description,
}: FileUploadProps) {
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
    <div>
      {label && (
        <label className="block text-sm font-medium text-text-secondary mb-1.5">{label}</label>
      )}
      <DragDropArea
        isDragging={isDragging}
        hasValue={!!value}
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className="p-4"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileInputChange}
          className="hidden"
        />

        {value ? (
          <div className="flex items-center gap-4">
            <div className="relative flex-shrink-0">
              <img
                src={value}
                alt="Preview"
                className="w-20 h-20 object-cover rounded-md border border-border"
              />
              <button
                type="button"
                onClick={handleRemove}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center hover:bg-red-700 transition-colors text-xs"
                title="Remove image"
              >
                ×
              </button>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-text-primary font-medium">Image uploaded</p>
              <p className="text-xs text-text-tertiary mt-1">
                Click to change or drag a new image here
              </p>
            </div>
            <IconImage className="w-5 h-5 text-text-tertiary flex-shrink-0" />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center">
            <IconUpload className="w-8 h-8 text-text-tertiary mb-2" />
            <p className="text-sm text-text-primary font-medium mb-1">
              Click to upload or drag and drop
            </p>
            <p className="text-xs text-text-tertiary">
              {description || `PNG, JPG, GIF up to ${maxSizeMB}MB`}
            </p>
          </div>
        )}
      </DragDropArea>
      {error && (
        <p className="text-xs text-red-600 mt-1.5">{error}</p>
      )}
    </div>
  );
}
