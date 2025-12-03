import { forwardRef, useImperativeHandle, useRef, useEffect } from 'react';
import { IconSend, Input, Button, ButtonType, ButtonVariant } from '@openai/ui';
import { useTranslation, I18nNamespace } from '@openai/i18n';

interface ChatInputProps {
  input: string;
  onInputChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  disabled?: boolean;
  onRefReady?: (ref: ChatInputRef) => void;
}

export interface ChatInputRef {
  focus: () => void;
}

const ChatInput = forwardRef<ChatInputRef, ChatInputProps>(
  ({ input, onInputChange, onSubmit, disabled, onRefReady }, ref) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const { t } = useTranslation(I18nNamespace.CLIENT);
    const refInstanceRef = useRef<ChatInputRef | null>(null);

    const refInstance: ChatInputRef = {
      focus: () => {
        inputRef.current?.focus();
      },
    };

    useImperativeHandle(ref, () => refInstance);

    // Notify parent when component mounts and ref is ready
    useEffect(() => {
      if (!refInstanceRef.current) {
        refInstanceRef.current = refInstance;
        onRefReady?.(refInstance);
      }
      // Only run once on mount - onRefReady callback is stable
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
      <form
        className="flex p-3 border-t border-border gap-2"
        onSubmit={onSubmit}
      >
        <Input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            onInputChange(e.target.value)
          }
          placeholder={t('chat.placeholder')}
          disabled={disabled}
          className="flex-1"
        />
        <Button
          type={ButtonType.SUBMIT}
          disabled={disabled || !input.trim()}
          variant={ButtonVariant.PRIMARY}
          size="sm"
          className="w-8 p-0"
          tooltip={t('chat.send')}
        >
          <IconSend className="w-4 h-4" />
        </Button>
      </form>
    );
  }
);

ChatInput.displayName = 'ChatInput';

export default ChatInput;
