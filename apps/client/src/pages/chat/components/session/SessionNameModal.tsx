import { useEffect, useRef } from 'react';
import { IconClose } from '@openai/ui';
import { NUMERIC_CONSTANTS } from '../../../../constants/numeric.constants';
import { useUpdateSession } from '../../../../hooks/mutations/use-agent-mutations';
import { useFormValidation } from '@openai/utils';
import { useTranslation, I18nNamespace } from '@openai/i18n';
import {
  FormButton,
  FormContainer,
  ButtonType,
  ButtonVariant,
} from '@openai/ui';

interface SessionNameModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentName: string | null;
  onSave?: (name: string) => Promise<void>;
  agentId: number;
  sessionId: number;
}

interface SessionFormValues extends Record<string, unknown> {
  name: string;
}

export default function SessionNameModal({
  isOpen,
  onClose,
  currentName,
  onSave,
  agentId,
  sessionId,
}: SessionNameModalProps) {
  const { t } = useTranslation(I18nNamespace.CLIENT);
  const inputRef = useRef<HTMLInputElement>(null);
  const updateSessionMutation = useUpdateSession();

  const { values, errors, touched, setValue, setTouched } =
    useFormValidation<SessionFormValues>({}, { name: currentName || '' });

  useEffect(() => {
    if (isOpen) {
      setValue('name', currentName || '');
      // Focus input after modal opens
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, NUMERIC_CONSTANTS.UI_DEBOUNCE_DELAY);
    }
  }, [isOpen, currentName, setValue]);

  const handleSave = async () => {
    const trimmedName = values.name.trim();

    if (trimmedName === (currentName || '')) {
      onClose();
      return;
    }

    try {
      await updateSessionMutation.mutateAsync({
        agentId,
        sessionId,
        sessionName: trimmedName || undefined,
      });
      if (onSave) {
        await onSave(trimmedName || '');
      }
      onClose();
    } catch (error) {
      // Error is handled by mutation hook (toast notification)
      console.error('Failed to update session name:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !updateSessionMutation.isPending) {
      handleSave();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  const saving = updateSessionMutation.isPending;
  const formError = updateSessionMutation.error;
  const errorMessage =
    formError && typeof formError === 'object' && 'message' in formError
      ? (formError as { message: string }).message
      : null;

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
          <h2 className="text-lg font-semibold text-text-secondary">
            {t('chat.editSessionName')}
          </h2>
          <button
            onClick={onClose}
            className="text-text-tertiary hover:text-text-primary transition-colors"
            aria-label={t('common.close')}
          >
            <IconClose className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-4">
          <FormContainer saving={saving} error={errorMessage}>
            <div className="mb-4">
              <label
                htmlFor="session-name"
                className="block text-sm font-medium text-text-secondary mb-1.5"
              >
                {t('chat.sessionName')}
              </label>
              <input
                ref={inputRef}
                id="session-name"
                type="text"
                value={values.name}
                onChange={(e) => setValue('name', e.target.value)}
                onBlur={() => setTouched('name')}
                onKeyDown={handleKeyDown}
                disabled={saving}
                className="w-full h-8 px-3 border border-border-input rounded-md text-sm text-text-primary bg-background focus:outline-none focus:border-border-focus disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder={t('chat.enterSessionName')}
              />
              {touched.name && errors.name && (
                <p className="text-xs text-red-600 mt-1">{errors.name}</p>
              )}
              <p className="text-xs text-text-tertiary mt-1">
                {t('chat.defaultSessionName')}
              </p>
            </div>
          </FormContainer>
        </div>
        <div className="px-6 py-4 border-t border-border flex justify-end gap-2">
          <FormButton
            type={ButtonType.BUTTON}
            onClick={onClose}
            disabled={saving}
            variant={ButtonVariant.SECONDARY}
          >
            {t('common.cancel')}
          </FormButton>
          <FormButton
            type={ButtonType.BUTTON}
            onClick={handleSave}
            loading={saving}
            disabled={saving}
            variant={ButtonVariant.PRIMARY}
            tooltip={saving ? t('config.saving') : t('common.save')}
          >
            {t('common.save')}
          </FormButton>
        </div>
      </div>
    </div>
  );
}
