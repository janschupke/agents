import { useEffect, useRef } from 'react';
import { Input, Card, ModalHeader, ModalFooter } from '@openai/ui';
import { NUMERIC_CONSTANTS } from '../../../../constants/numeric.constants';
import { useUpdateSession } from '../../../../hooks/mutations/use-agent-mutations';
import { useFormValidation } from '@openai/utils';
import { useTranslation, I18nNamespace } from '@openai/i18n';
import {
  FormButton,
  FormContainer,
  FormField,
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
      <div onClick={(e) => e.stopPropagation()}>
        <Card variant="elevated" padding="none" className="w-full max-w-md m-4">
          <ModalHeader title={t('chat.editSessionName')} onClose={onClose} />
          <div className="px-6 py-4">
            <FormContainer saving={saving} error={errorMessage}>
              <FormField
                label={t('chat.sessionName')}
                labelFor="session-name"
                error={errors.name}
                touched={touched.name}
                hint={t('chat.defaultSessionName')}
              >
                <Input
                  ref={inputRef}
                  id="session-name"
                  type="text"
                  value={values.name}
                  onChange={(e) => setValue('name', e.target.value)}
                  onBlur={() => setTouched('name')}
                  onKeyDown={handleKeyDown}
                  disabled={saving}
                  className="w-full"
                  placeholder={t('chat.enterSessionName')}
                />
              </FormField>
            </FormContainer>
          </div>
          <ModalFooter>
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
          </ModalFooter>
        </Card>
      </div>
    </div>
  );
}
