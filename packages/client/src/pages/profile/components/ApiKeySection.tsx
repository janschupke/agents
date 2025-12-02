import { IconPencil, IconTrash, IconClose, IconCheck } from '../../../components/ui/Icons';
import { FormButton, FormContainer, ValidatedInput, ButtonType, ButtonVariant } from '../../../components/ui/form';
import { useApiKey } from '../hooks/use-api-key';

/**
 * API Key management section component
 */
export default function ApiKeySection() {
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
            OpenAI API Key {!hasApiKey && <span className="text-red-600">*</span>}
          </label>
          {!hasApiKey && (
            <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                <strong>Required:</strong> You must set your OpenAI API key to use the chat
                feature. Get your API key from{' '}
                <a
                  href="https://platform.openai.com/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-yellow-900"
                >
                  OpenAI Platform
                </a>
              </p>
            </div>
          )}
          <p className="text-xs text-text-tertiary mb-3">
            Your API key is encrypted and stored securely. It will never be sent back to the
            frontend in plaintext.
          </p>
          {!showApiKeyInput && hasApiKey ? (
            <div className="flex items-center gap-2">
              <input
                type="password"
                value="••••••••••••••••••••••••••••••••"
                disabled
                className="flex-1 h-8 px-3 border border-border-input rounded-md text-sm text-text-tertiary bg-background-tertiary font-mono cursor-not-allowed"
                placeholder="API key is set"
              />
              <button
                onClick={handleEditApiKey}
                disabled={saving}
                className="h-8 w-8 flex items-center justify-center text-text-tertiary hover:text-text-primary hover:bg-background-tertiary rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Edit API key"
              >
                <IconPencil className="w-4 h-4" />
              </button>
              <button
                onClick={handleDeleteApiKey}
                disabled={saving}
                className="h-8 w-8 flex items-center justify-center text-text-tertiary hover:text-red-600 hover:bg-background-tertiary rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Delete API key"
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
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setValue('apiKey', e.target.value)}
                  onBlur={() => setTouched('apiKey')}
                  disabled={saving}
                  error={errors.apiKey}
                  touched={touched.apiKey}
                  className="flex-1 font-mono"
                  placeholder="Enter your OpenAI API key"
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
                  tooltip={saving ? 'Saving...' : 'Save API key'}
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
