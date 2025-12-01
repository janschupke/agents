import { useRef, useState, useCallback } from 'react';
import { IconImage, IconUpload } from './Icons';

interface AvatarPickerProps {
  value: string | null; // Base64 data URL or null
  onChange: (value: string | null) => void;
  accept?: string;
  maxSizeMB?: number;
}

export default function AvatarPicker({
  value,
  onChange,
  accept = 'image/*',
  maxSizeMB = 5,
}: AvatarPickerProps) {
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
    <div className="flex-shrink-0">
      <label className="block text-sm font-medium text-text-secondary mb-1.5">Avatar</label>
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative w-24 h-24 border-2 border-dashed rounded-md cursor-pointer transition-colors flex items-center justify-center
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
      </div>
      {error && (
        <p className="text-xs text-red-600 mt-1.5">{error}</p>
      )}
    </div>
  );
}
