import { useState, useEffect, useRef } from 'react';
import { IconClose } from '../ui/Icons';
import { NUMERIC_CONSTANTS } from '../../constants/numeric.constants.js';

interface SessionNameModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentName: string | null;
  onSave: (name: string) => Promise<void>;
}

export default function SessionNameModal({
  isOpen,
  onClose,
  currentName,
  onSave,
}: SessionNameModalProps) {
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setName(currentName || '');
      setError(null);
      // Focus input after modal opens
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, NUMERIC_CONSTANTS.UI_DEBOUNCE_DELAY);
    }
  }, [isOpen, currentName]);

  const handleSave = async () => {
    setError(null);
    const trimmedName = name.trim();

    if (trimmedName === (currentName || '')) {
      onClose();
      return;
    }

    setSaving(true);
    try {
      await onSave(trimmedName || '');
      onClose();
    } catch (err) {
      const error = err as { message?: string };
      setError(error?.message || 'Failed to update session name');
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !saving) {
      handleSave();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={onClose}
    >
      <div
        className="bg-background border border-border w-full max-w-md m-4 rounded-lg shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-text-secondary">Edit Session Name</h2>
          <button
            onClick={onClose}
            className="text-text-tertiary hover:text-text-primary transition-colors"
            aria-label="Close"
          >
            <IconClose className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-4">
          <div className="mb-4">
            <label
              htmlFor="session-name"
              className="block text-sm font-medium text-text-secondary mb-1.5"
            >
              Session Name
            </label>
            <input
              ref={inputRef}
              id="session-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={saving}
              className="w-full h-8 px-3 border border-border-input rounded-md text-sm text-text-primary bg-background focus:outline-none focus:border-border-focus disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="Enter session name (optional)"
            />
            <p className="text-xs text-text-tertiary mt-1">
              Leave empty to use default name based on creation date
            </p>
          </div>
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-800 px-3 py-2 rounded-md text-sm">
              {error}
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-border flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={saving}
            className="h-8 px-4 bg-background text-text-primary border border-border rounded-md text-sm font-medium cursor-pointer transition-colors hover:bg-background-tertiary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="h-8 px-4 bg-primary text-text-inverse border-none rounded-md text-sm font-medium cursor-pointer transition-colors hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
