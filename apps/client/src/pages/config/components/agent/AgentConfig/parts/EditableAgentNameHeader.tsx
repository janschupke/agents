import { useState, useRef, useEffect } from 'react';
import { useTranslation, I18nNamespace } from '@openai/i18n';

interface EditableAgentNameHeaderProps {
  name: string;
  onNameChange: (name: string) => void;
  isSaving?: boolean;
}

export default function EditableAgentNameHeader({
  name,
  onNameChange,
  isSaving = false,
}: EditableAgentNameHeaderProps) {
  const { t } = useTranslation(I18nNamespace.CLIENT);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditValue(name);
  }, [name]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleClick = () => {
    if (!isSaving) {
      setIsEditing(true);
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (editValue.trim() && editValue !== name) {
      onNameChange(editValue.trim());
    } else {
      setEditValue(name);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    } else if (e.key === 'Escape') {
      setEditValue(name);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="text-2xl font-semibold bg-background border border-border-focus rounded px-2 py-1 w-full focus:outline-none focus:ring-2 focus:ring-primary"
        disabled={isSaving}
      />
    );
  }

  return (
    <h1
      onClick={handleClick}
      className="text-2xl font-semibold text-text-primary cursor-pointer hover:text-primary transition-colors"
      title="Click to edit"
    >
      {name || t('config.untitledAgent')}
    </h1>
  );
}
