import { useEffect, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import PageContainer from '../../../components/ui/PageContainer';
import PageHeader from '../../../components/ui/PageHeader';
import { IconPencil, IconTrash, IconClose, IconCheck } from '../../../components/ui/Icons';
import { useConfirm } from '../../../hooks/useConfirm';
import { useUser as useUserQuery } from '../../../hooks/queries/use-user.js';
import { useUpdateApiKey, useDeleteApiKey } from '../../../hooks/mutations/use-user-mutations.js';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../../hooks/queries/query-keys.js';
import { useFormValidation } from '../../../hooks/use-form-validation.js';
import { validationRules } from '../../../utils/validation.js';
import FormButton from '../../../components/ui/FormButton.js';
import FormContainer from '../../../components/ui/FormContainer.js';
import ValidatedInput from '../../../components/ui/ValidatedInput.js';
import { ButtonType, ButtonVariant } from '../../../components/ui/form-types.js';
import LoadingWrapper from '../../../components/ui/LoadingWrapper.js';

interface ApiKeyFormValues {
  apiKey: string;
}

export default function UserProfile() {
  const { user: clerkUser } = useUser();
  const { data: userInfo, isLoading: loadingUser } = useUserQuery();
  const { confirm, ConfirmDialog } = useConfirm();
  const queryClient = useQueryClient();
  const updateApiKeyMutation = useUpdateApiKey();
  const deleteApiKeyMutation = useDeleteApiKey();

  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);

  // Check API key status
  useEffect(() => {
    const checkApiKey = async () => {
      try {
        const { ApiCredentialsService } = await import('../../services/api-credentials.service.js');
        const hasKey = await ApiCredentialsService.hasOpenAIKey();
        setHasApiKey(hasKey);
        if (hasKey) {
          setShowApiKeyInput(false);
        } else {
          setShowApiKeyInput(true);
        }
      } catch {
        setHasApiKey(false);
        setShowApiKeyInput(true);
      }
    };
    checkApiKey();
  }, []);

  const validationSchema = {
    apiKey: [validationRules.required('API key is required')],
  };

  const {
    values,
    errors,
    touched,
    setValue,
    setTouched,
    validateAll,
    reset,
  } = useFormValidation<ApiKeyFormValues>(validationSchema, { apiKey: '' });

  const handleSaveApiKey = async () => {
    const validation = validateAll();
    if (!validation.isValid) {
      return;
    }

    try {
      await updateApiKeyMutation.mutateAsync(values.apiKey);
      setHasApiKey(true);
      setShowApiKeyInput(false);
      reset();
      queryClient.invalidateQueries({ queryKey: queryKeys.user.apiKey() });
    } catch (error) {
      // Error is handled by mutation hook
      console.error('Failed to save API key:', error);
    }
  };

  const handleDeleteApiKey = async () => {
    const confirmed = await confirm({
      title: 'Delete API Key',
      message: 'Are you sure you want to delete your API key? You will need to set it again to use the chat.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      confirmVariant: 'danger',
    });

    if (!confirmed) {
      return;
    }

    try {
      await deleteApiKeyMutation.mutateAsync();
      setHasApiKey(false);
      setShowApiKeyInput(true);
      reset();
      queryClient.invalidateQueries({ queryKey: queryKeys.user.apiKey() });
    } catch (error) {
      // Error is handled by mutation hook
      console.error('Failed to delete API key:', error);
    }
  };

  const handleEditApiKey = () => {
    setShowApiKeyInput(true);
    reset();
  };

  const handleCancelEdit = () => {
    setShowApiKeyInput(false);
    reset();
  };

  const saving = updateApiKeyMutation.isPending || deleteApiKeyMutation.isPending;
  const formError = updateApiKeyMutation.error || deleteApiKeyMutation.error;
  const errorMessage = formError && typeof formError === 'object' && 'message' in formError
    ? (formError as { message: string }).message
    : null;

  const displayUser = userInfo || {
    id: clerkUser?.id || '',
    email: clerkUser?.primaryEmailAddress?.emailAddress || null,
    firstName: clerkUser?.firstName || null,
    lastName: clerkUser?.lastName || null,
    imageUrl: clerkUser?.imageUrl || null,
    roles: [],
  };

  return (
    <PageContainer>
      <div className="flex flex-col h-full overflow-hidden">
        <PageHeader title="User Profile" />
        <div className="flex-1 overflow-y-auto p-8">
          <LoadingWrapper isLoading={loadingUser && !userInfo} loadingText="Loading user info...">
            <div className="space-y-6">
              {/* Profile Image */}
              <div className="flex items-center gap-6">
                {displayUser.imageUrl ? (
                  <img
                    src={displayUser.imageUrl}
                    alt="Profile"
                    className="w-24 h-24 rounded-full border-4 border-border"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center text-text-inverse text-3xl font-semibold border-4 border-border">
                    {(displayUser.firstName || displayUser.email || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-semibold text-text-primary">
                    {displayUser.firstName || displayUser.lastName
                      ? `${displayUser.firstName || ''} ${displayUser.lastName || ''}`.trim()
                      : 'User'}
                  </h3>
                  {displayUser.email && (
                    <p className="text-text-secondary mt-1">{displayUser.email}</p>
                  )}
                </div>
              </div>

              {/* User Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-text-secondary">User ID</label>
                  <p className="mt-1 text-text-primary font-mono text-sm break-all">
                    {displayUser.id}
                  </p>
                </div>

                {displayUser.firstName && (
                  <div>
                    <label className="text-sm font-medium text-text-secondary">First Name</label>
                    <p className="mt-1 text-text-primary">{displayUser.firstName}</p>
                  </div>
                )}

                {displayUser.lastName && (
                  <div>
                    <label className="text-sm font-medium text-text-secondary">Last Name</label>
                    <p className="mt-1 text-text-primary">{displayUser.lastName}</p>
                  </div>
                )}

                {displayUser.email && (
                  <div>
                    <label className="text-sm font-medium text-text-secondary">Email</label>
                    <p className="mt-1 text-text-primary">{displayUser.email}</p>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-text-secondary">Roles</label>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {displayUser.roles && displayUser.roles.length > 0 ? (
                      displayUser.roles.map((role, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-primary text-text-inverse text-xs font-medium rounded-full"
                        >
                          {role}
                        </span>
                      ))
                    ) : (
                      <span className="text-text-secondary text-sm">No roles assigned</span>
                    )}
                  </div>
                </div>
              </div>

              {/* API Key Section */}
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
                            onChange={(e) => setValue('apiKey', e.target.value)}
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
            </div>
          </LoadingWrapper>
        </div>
      </div>
      {ConfirmDialog}
    </PageContainer>
  );
}
