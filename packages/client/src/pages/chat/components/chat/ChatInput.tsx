import { forwardRef, useImperativeHandle, useRef } from 'react';
import { IconSend } from '../../../../components/ui/Icons';

interface ChatInputProps {
  input: string;
  onInputChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  disabled?: boolean;
}

export interface ChatInputRef {
  focus: () => void;
}

const ChatInput = forwardRef<ChatInputRef, ChatInputProps>(
  ({ input, onInputChange, onSubmit, disabled }, ref) => {
    const inputRef = useRef<HTMLInputElement>(null);

    useImperativeHandle(ref, () => ({
      focus: () => {
        inputRef.current?.focus();
      },
    }));

    return (
      <form className="flex p-3 border-t border-border gap-2" onSubmit={onSubmit}>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          placeholder="Type your message..."
          disabled={disabled}
          className="flex-1 h-8 px-3 border border-border-input rounded-md text-sm text-text-primary bg-background focus:outline-none focus:border-border-focus disabled:bg-disabled-bg disabled:cursor-not-allowed"
        />
      <button
        type="submit"
        disabled={disabled || !input.trim()}
        className="h-8 w-8 flex items-center justify-center bg-primary text-text-inverse border-none rounded-md cursor-pointer transition-colors hover:bg-primary-hover disabled:bg-disabled disabled:cursor-not-allowed"
        title="Send message"
      >
        <IconSend className="w-4 h-4" />
      </button>
    </form>
  );
  }
);

ChatInput.displayName = 'ChatInput';

export default ChatInput;
