import {
  IconPencil,
  IconTrash,
  IconClose,
  IconCheck,
  FormButton,
  FormContainer,
  ValidatedInput,
  FormField,
  Button,
  Input,
  Card,
  ButtonType,
  ButtonVariant,
} from '@openai/ui';
import { useTranslation, I18nNamespace } from '@openai/i18n';
import { useApiKey } from '../../hooks/use-api-key';

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
        <FormField
          label={t('profile.apiKey.title')}
          required={!hasApiKey}
          error={errors.apiKey}
          touched={touched.apiKey}
        >
          {!hasApiKey && (
            <Card
              padding="sm"
              variant="outlined"
              className="mb-3 bg-yellow-50 border-yellow-200"
            >
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
            </Card>
          )}
          <p className="text-xs text-text-tertiary mb-3">
            {t('profile.apiKey.securityNote')}
          </p>
          {!showApiKeyInput && hasApiKey ? (
            <div className="flex items-center gap-2">
              <Input
                type="password"
                value="••••••••••••••••••••••••••••••••"
                disabled
                className="flex-1 font-mono bg-background-tertiary text-text-tertiary cursor-not-allowed"
                placeholder={t('profile.apiKey.apiKeySet')}
              />
              <Button
                onClick={handleEditApiKey}
                disabled={saving}
                variant={ButtonVariant.ICON}
                size="sm"
                className="w-8 p-0"
                tooltip={t('profile.apiKey.editApiKey')}
              >
                <IconPencil className="w-4 h-4" />
              </Button>
              <Button
                onClick={handleDeleteApiKey}
                disabled={saving}
                variant={ButtonVariant.ICON}
                size="sm"
                className="w-8 p-0 hover:text-red-500"
                tooltip={t('profile.apiKey.deleteApiKey')}
              >
                <IconTrash className="w-4 h-4" />
              </Button>
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
        </FormField>
      </FormContainer>
    </div>
  );
}
