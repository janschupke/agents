import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useUpdateApiKey, useDeleteApiKey } from '../../../hooks/mutations/use-user-mutations';
import { queryKeys } from '../../../hooks/queries/query-keys';
import { useApiKeyStatus } from '../../../hooks/queries/use-user';
import { useConfirm } from '../../../hooks/useConfirm';
import { useFormValidation } from '../../../hooks/use-form-validation';
import { validationRules } from '../../../utils/validation';

export interface ApiKeyFormValues extends Record<string, unknown> {
  apiKey: string;
}

interface UseApiKeyReturn {
  showApiKeyInput: boolean;
  hasApiKey: boolean;
  values: ApiKeyFormValues;
  errors: Partial<Record<keyof ApiKeyFormValues, string | null>>;
  touched: Partial<Record<keyof ApiKeyFormValues, boolean>>;
  saving: boolean;
  errorMessage: string | null;
  setValue: (field: keyof ApiKeyFormValues, value: string) => void;
  setTouched: (field: keyof ApiKeyFormValues) => void;
  handleSaveApiKey: () => Promise<void>;
  handleDeleteApiKey: () => Promise<void>;
  handleEditApiKey: () => void;
  handleCancelEdit: () => void;
}

/**
 * Manages API key state and operations
 */
export function useApiKey(): UseApiKeyReturn {
  const { confirm } = useConfirm();
  const queryClient = useQueryClient();
  const updateApiKeyMutation = useUpdateApiKey();
  const deleteApiKeyMutation = useDeleteApiKey();
  const { data: apiKeyData, refetch: refetchApiKey } = useApiKeyStatus();
  const hasApiKey = apiKeyData?.hasApiKey ?? false;

  const [showApiKeyInput, setShowApiKeyInput] = useState(false);

  // Update UI based on API key status from context
  useEffect(() => {
    if (hasApiKey) {
      setShowApiKeyInput(false);
    } else {
      setShowApiKeyInput(true);
    }
  }, [hasApiKey]);

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
      setShowApiKeyInput(false);
      reset();
      // Refresh API key status
      await refetchApiKey();
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
      setShowApiKeyInput(true);
      reset();
      // Refresh API key status
      await refetchApiKey();
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

  return {
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
  };
}
