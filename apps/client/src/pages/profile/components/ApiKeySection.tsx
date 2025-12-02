import {
  IconPencil,
  IconTrash,
  IconClose,
  IconCheck,
} from '../../../components/ui/Icons';
import {
  FormButton,
  FormContainer,
  ValidatedInput,
  ButtonType,
  ButtonVariant,
} from '../../../components/ui/form';
import { useTranslation, I18nNamespace } from '@openai/i18n';
import { useApiKey } from '../hooks/use-api-key';

/**
 * API Key management section component
 */
export default function ApiKeySection() {
  const { t } = useTranslation(I18nNamespace.CLIENT);
  const {
    showApiKeyInput,
    hasApiKey,
    values,
    errors,
    touched,
    saving,
    errorMessage,
    setValue,
    setTouched,
    handleSaveApiKey,
    handleDeleteApiKey,
    handleEditApiKey,
    handleCancelEdit,
  } = useApiKey();

  return (
    <div className="pt-4 border-t border-border">
      <FormContainer saving={saving} error={errorMessage}>
        <div className="mb-4">
          <label className="text-sm font-medium text-text-secondary block mb-2">
            {t('profile.apiKey.title')}{' '}
            {!hasApiKey && <span className="text-red-600">*</span>}
          </label>
          {!hasApiKey && (
            <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                <strong>{t('profile.apiKey.requiredLabel')}</strong>{' '}
                {t('profile.apiKey.requiredMessage')}{' '}
                <a
                  href="https://platform.openai.com/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-yellow-900"
                >
                  {t('profile.apiKey.openaiPlatform')}
                </a>
              </p>
            </div>
          )}
          <p className="text-xs text-text-tertiary mb-3">
            {t('profile.apiKey.securityNote')}
          </p>
          {!showApiKeyInput && hasApiKey ? (
            <div className="flex items-center gap-2">
              <input
                type="password"
                value="••••••••••••••••••••••••••••••••"
                disabled
                className="flex-1 h-8 px-3 border border-border-input rounded-md text-sm text-text-tertiary bg-background-tertiary font-mono cursor-not-allowed"
                placeholder={t('profile.apiKey.apiKeySet')}
              />
              <button
                onClick={handleEditApiKey}
                disabled={saving}
                className="h-8 w-8 flex items-center justify-center text-text-tertiary hover:text-text-primary hover:bg-background-tertiary rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title={t('profile.apiKey.editApiKey')}
              >
                <IconPencil className="w-4 h-4" />
              </button>
              <button
                onClick={handleDeleteApiKey}
                disabled={saving}
                className="h-8 w-8 flex items-center justify-center text-text-tertiary hover:text-red-600 hover:bg-background-tertiary rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title={t('profile.apiKey.deleteApiKey')}
              >
                <IconTrash className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <ValidatedInput
                  type="password"
                  value={values.apiKey}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setValue('apiKey', e.target.value)
                  }
                  onBlur={() => setTouched('apiKey')}
                  disabled={saving}
                  error={errors.apiKey}
                  touched={touched.apiKey}
                  className="flex-1 font-mono"
                  placeholder={t('profile.apiKey.enterApiKey')}
                />
                {hasApiKey && (
                  <FormButton
                    type={ButtonType.BUTTON}
                    onClick={handleCancelEdit}
                    disabled={saving}
                    variant={ButtonVariant.SECONDARY}
                  >
                    <IconClose className="w-4 h-4" />
                  </FormButton>
                )}
                <FormButton
                  type={ButtonType.BUTTON}
                  onClick={handleSaveApiKey}
                  loading={saving}
                  disabled={saving || !values.apiKey.trim()}
                  variant={ButtonVariant.PRIMARY}
                  tooltip={
                    saving
                      ? t('profile.apiKey.saving')
                      : t('profile.apiKey.saveTooltip')
                  }
                >
                  <IconCheck className="w-4 h-4" />
                </FormButton>
              </div>
            </div>
          )}
        </div>
      </FormContainer>
    </div>
  );
}
