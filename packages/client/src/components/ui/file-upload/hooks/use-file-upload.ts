import { useState, useCallback, useRef } from 'react';

interface UseFileUploadOptions {
  accept?: string;
  maxSizeMB?: number;
  onChange: (value: string | null) => void;
}

interface UseFileUploadReturn {
  fileInputRef: React.RefObject<HTMLInputElement>;
  isDragging: boolean;
  error: string | null;
  handleFileInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleDragOver: (e: React.DragEvent) => void;
  handleDragLeave: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent) => void;
  handleClick: () => void;
  handleRemove: (e: React.MouseEvent) => void;
}

/**
 * Hook for file upload functionality with validation and base64 conversion
 */
export function useFileUpload({
  accept = 'image/*',
  maxSizeMB = 5,
  onChange,
}: UseFileUploadOptions): UseFileUploadReturn {
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

  return {
    fileInputRef,
    isDragging,
    error,
    handleFileInputChange,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleClick,
    handleRemove,
  };
}
