import { useRef, useState, useCallback } from 'react';
import { IconImage, IconUpload } from './Icons';

interface FileUploadProps {
  value: string | null; // Base64 data URL or null
  onChange: (value: string | null) => void;
  accept?: string;
  maxSizeMB?: number;
  label?: string;
  description?: string;
}

export default function FileUpload({
  value,
  onChange,
  accept = 'image/*',
  maxSizeMB = 5,
  label = 'Upload Image',
  description,
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateAndConvertFile = useCallback(
    (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        // Check file type
        if (!file.type.startsWith('image/')) {
          reject(new Error('Please select an image file'));
          return;
        }

        // Check file size
        const maxSizeBytes = maxSizeMB * 1024 * 1024;
        if (file.size > maxSizeBytes) {
          reject(new Error(`File size must be less than ${maxSizeMB}MB`));
          return;
        }

        // Convert to base64
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result;
          if (typeof result === 'string') {
            resolve(result);
          } else {
            reject(new Error('Failed to read file'));
          }
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      });
    },
    [maxSizeMB]
  );

  const handleFileSelect = useCallback(
    async (file: File) => {
      setError(null);
      try {
        const dataUrl = await validateAndConvertFile(file);
        onChange(dataUrl);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to upload file';
        setError(errorMessage);
      }
    },
    [validateAndConvertFile, onChange]
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
      // Reset input so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const file = e.dataTransfer.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleRemove = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange(null);
      setError(null);
    },
    [onChange]
  );

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-text-secondary mb-1.5">{label}</label>
      )}
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-md p-4 cursor-pointer transition-colors
          ${
            isDragging
              ? 'border-primary bg-primary/5'
              : value
                ? 'border-border hover:border-border-focus'
                : 'border-border-input hover:border-border-focus bg-background'
          }
        `}
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
      </div>
      {error && (
        <p className="text-xs text-red-600 mt-1.5">{error}</p>
      )}
    </div>
  );
}
