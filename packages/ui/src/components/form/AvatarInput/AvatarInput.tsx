import { useState } from 'react';
import { IconUpload } from '../../Icons';
import { useFileUpload } from '../../file-upload/hooks/use-file-upload';
import DragDropArea from '../../file-upload/components/DragDropArea';
import Input from '../Input';
import FormField from '../FormField';

export interface AvatarInputProps {
  value: string | null;
  onChange: (value: string | null) => void;
  accept?: string;
  maxSizeMB?: number;
  id?: string;
  label?: string;
  labelFor?: string;
  hint?: string;
  error?: string | null;
  disabled?: boolean;
  allowUrlInput?: boolean;
  className?: string;
}

/**
 * Avatar input component with support for file upload and URL input
 */
export default function AvatarInput({
  value,
  onChange,
  accept = 'image/*',
  maxSizeMB = 5,
  id,
  label = 'Avatar',
  labelFor,
  hint,
  error,
  disabled = false,
  allowUrlInput = true,
  className = '',
}: AvatarInputProps) {
  const [inputMode, setInputMode] = useState<'upload' | 'url'>(
    value && !value.startsWith('data:') ? 'url' : 'upload'
  );
  const [urlValue, setUrlValue] = useState(
    value && !value.startsWith('data:') ? value : ''
  );

  const {
    fileInputRef,
    isDragging,
    error: uploadError,
    handleFileInputChange,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleClick,
    handleRemove,
  } = useFileUpload({ accept, maxSizeMB, onChange });

  const handleUrlChange = (url: string) => {
    setUrlValue(url);
    onChange(url || null);
  };

  const handleUrlSubmit = () => {
    onChange(urlValue || null);
  };

  const displayError = error || uploadError;

  return (
    <div className={className}>
      <FormField
        label={label}
        labelFor={labelFor || id}
        hint={hint}
        error={displayError}
      >
        <div className="flex items-start gap-4">
          {/* Avatar preview/upload area */}
          <div className="flex-shrink-0">
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
                disabled={disabled}
              />

              {value ? (
                <div className="relative w-full h-full">
                  <img
                    src={value}
                    alt="Avatar"
                    className="w-full h-full object-cover rounded-md"
                  />
                  {!disabled && (
                    <button
                      type="button"
                      onClick={handleRemove}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-red-600 text-white rounded-full flex items-center justify-center hover:bg-red-700 transition-colors text-xs"
                      title="Remove avatar"
                    >
                      ×
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center p-2">
                  <IconUpload className="w-5 h-5 text-text-tertiary mb-1" />
                  <span className="text-xs text-text-tertiary">Upload</span>
                </div>
              )}
            </DragDropArea>
          </div>

          {/* URL input (if enabled) */}
          {allowUrlInput && (
            <div className="flex-1">
              <div className="flex gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => setInputMode('upload')}
                  disabled={disabled}
                  className={`text-xs px-2 py-1 rounded ${
                    inputMode === 'upload'
                      ? 'bg-primary text-text-inverse'
                      : 'bg-background-secondary text-text-primary border border-border'
                  } disabled:opacity-50`}
                >
                  Upload
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode('url')}
                  disabled={disabled}
                  className={`text-xs px-2 py-1 rounded ${
                    inputMode === 'url'
                      ? 'bg-primary text-text-inverse'
                      : 'bg-background-secondary text-text-primary border border-border'
                  } disabled:opacity-50`}
                >
                  URL
                </button>
              </div>
              {inputMode === 'url' && (
                <Input
                  type="url"
                  value={urlValue}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleUrlChange(e.target.value)}
                  onBlur={handleUrlSubmit}
                  placeholder="https://..."
                  disabled={disabled}
                  size="sm"
                />
              )}
            </div>
          )}
        </div>
      </FormField>
    </div>
  );
}
