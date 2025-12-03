import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { TestQueryProvider } from '../../../test/utils/test-query-provider';
import { ToastProvider } from '../../../contexts/ToastContext';
import { useApiKey } from './use-api-key';

// Mock useConfirm
const mockConfirm = vi.fn();
vi.mock('../../../hooks/ui/useConfirm', () => ({
  useConfirm: () => ({
    confirm: mockConfirm,
    ConfirmDialog: null,
  }),
}));

// Mock mutation hooks
const mockUpdateApiKey = vi.fn();
const mockDeleteApiKey = vi.fn();

const mockUseUpdateApiKey = vi.fn(() => ({
  mutateAsync: mockUpdateApiKey,
  isPending: false,
  error: null,
}));

const mockUseDeleteApiKey = vi.fn(() => ({
  mutateAsync: mockDeleteApiKey,
  isPending: false,
  error: null,
}));

vi.mock('../../../hooks/mutations/use-user-mutations', () => ({
  useUpdateApiKey: () => mockUseUpdateApiKey(),
  useDeleteApiKey: () => mockUseDeleteApiKey(),
}));

// Mock useApiKeyStatus
const mockRefetchApiKey = vi.fn();
const mockApiKeyData = { hasApiKey: false };

vi.mock('../../../hooks/queries/use-user', () => ({
  useApiKeyStatus: () => ({
    data: mockApiKeyData,
    refetch: mockRefetchApiKey,
  }),
}));

// Mock useFormValidation
let mockApiKeyValue = '';
const mockSetValue = vi.fn((field: string, value: string) => {
  if (field === 'apiKey') {
    mockApiKeyValue = value;
  }
});
const mockSetTouched = vi.fn();
const mockValidateAll = vi.fn(() => ({ isValid: true, errors: {} }));
const mockReset = vi.fn(() => {
  mockApiKeyValue = '';
});

vi.mock('@openai/utils', () => ({
  useFormValidation: () => ({
    get values() {
      return { apiKey: mockApiKeyValue };
    },
    errors: {},
    touched: {},
    setValue: mockSetValue,
    setTouched: mockSetTouched,
    validateAll: mockValidateAll,
    reset: mockReset,
  }),
  validationRules: {
    required: (message: string) => (value: unknown) =>
      !value ? message : null,
  },
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <TestQueryProvider>
    <ToastProvider>{children}</ToastProvider>
  </TestQueryProvider>
);

describe('useApiKey', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApiKeyData.hasApiKey = false;
    mockApiKeyValue = '';
  });

  it('should initialize with showApiKeyInput true when no API key', () => {
    const { result } = renderHook(() => useApiKey(), { wrapper });

    expect(result.current.showApiKeyInput).toBe(true);
    expect(result.current.hasApiKey).toBe(false);
  });

  it('should initialize with showApiKeyInput false when API key exists', () => {
    mockApiKeyData.hasApiKey = true;

    const { result } = renderHook(() => useApiKey(), { wrapper });

    expect(result.current.showApiKeyInput).toBe(false);
    expect(result.current.hasApiKey).toBe(true);
  });

  it('should save API key successfully', async () => {
    mockValidateAll.mockReturnValue({ isValid: true, errors: {} });
    mockUpdateApiKey.mockResolvedValue(undefined);

    const { result, rerender } = renderHook(() => useApiKey(), { wrapper });

    // Set the value using the hook's setValue - this updates mockApiKeyValue
    act(() => {
      result.current.setValue('apiKey', 'sk-test-key');
    });

    // Force a re-render to get updated values
    rerender();

    // Verify the value was set in our mock
    expect(mockApiKeyValue).toBe('sk-test-key');
    // The values should reflect the change after rerender
    expect(result.current.values.apiKey).toBe('sk-test-key');

    await act(async () => {
      await result.current.handleSaveApiKey();
    });

    expect(mockValidateAll).toHaveBeenCalled();
    // The mutation should be called with the value from values.apiKey
    // Since our mock getter returns mockApiKeyValue, it should work
    expect(mockUpdateApiKey).toHaveBeenCalledWith('sk-test-key');
    expect(mockRefetchApiKey).toHaveBeenCalled();
    expect(result.current.showApiKeyInput).toBe(false);
  });

  it('should not save API key when validation fails', async () => {
    mockValidateAll.mockReturnValue({
      isValid: false,
      errors: { apiKey: 'API key is required' },
    });

    const { result } = renderHook(() => useApiKey(), { wrapper });

    await act(async () => {
      await result.current.handleSaveApiKey();
    });

    expect(mockValidateAll).toHaveBeenCalled();
    expect(mockUpdateApiKey).not.toHaveBeenCalled();
  });

  it('should delete API key after confirmation', async () => {
    mockApiKeyData.hasApiKey = true;
    mockConfirm.mockResolvedValue(true);
    mockDeleteApiKey.mockResolvedValue(undefined);

    const { result } = renderHook(() => useApiKey(), { wrapper });

    await act(async () => {
      await result.current.handleDeleteApiKey();
    });

    expect(mockConfirm).toHaveBeenCalledWith({
      title: 'Delete API Key',
      message: expect.stringContaining('delete your API key'),
      confirmText: 'Delete',
      cancelText: 'Cancel',
      confirmVariant: 'danger',
    });

    expect(mockDeleteApiKey).toHaveBeenCalled();
    expect(mockRefetchApiKey).toHaveBeenCalled();
    expect(result.current.showApiKeyInput).toBe(true);
  });

  it('should not delete API key when confirmation is cancelled', async () => {
    mockApiKeyData.hasApiKey = true;
    mockConfirm.mockResolvedValue(false);

    const { result } = renderHook(() => useApiKey(), { wrapper });

    await act(async () => {
      await result.current.handleDeleteApiKey();
    });

    expect(mockConfirm).toHaveBeenCalled();
    expect(mockDeleteApiKey).not.toHaveBeenCalled();
  });

  it('should show API key input when edit is clicked', () => {
    mockApiKeyData.hasApiKey = true;

    const { result } = renderHook(() => useApiKey(), { wrapper });

    expect(result.current.showApiKeyInput).toBe(false);

    act(() => {
      result.current.handleEditApiKey();
    });

    expect(result.current.showApiKeyInput).toBe(true);
    expect(mockReset).toHaveBeenCalled();
  });

  it('should hide API key input when cancel is clicked', () => {
    const { result } = renderHook(() => useApiKey(), { wrapper });

    expect(result.current.showApiKeyInput).toBe(true);

    act(() => {
      result.current.handleCancelEdit();
    });

    expect(result.current.showApiKeyInput).toBe(false);
    expect(mockReset).toHaveBeenCalled();
  });

  it('should return saving state when mutation is pending', () => {
    mockUseUpdateApiKey.mockReturnValue({
      mutateAsync: mockUpdateApiKey,
      isPending: true,
      error: null,
    });

    const { result } = renderHook(() => useApiKey(), { wrapper });

    expect(result.current.saving).toBe(true);
  });

  it('should return error message when mutation fails', () => {
    const error = { message: 'Invalid API key' };
    mockUseUpdateApiKey.mockReturnValue({
      mutateAsync: mockUpdateApiKey,
      isPending: false,
      error: error as unknown as null,
    });

    const { result } = renderHook(() => useApiKey(), { wrapper });

    expect(result.current.errorMessage).toBe('Invalid API key');
  });

  it('should handle save errors gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockValidateAll.mockReturnValue({ isValid: true, errors: {} });
    mockUpdateApiKey.mockRejectedValue(new Error('Save failed'));

    const { result } = renderHook(() => useApiKey(), { wrapper });

    act(() => {
      result.current.setValue('apiKey', 'sk-test-key');
    });

    await act(async () => {
      await result.current.handleSaveApiKey();
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to save API key:',
      expect.any(Error)
    );

    consoleSpy.mockRestore();
  });

  it('should handle delete errors gracefully', async () => {
    mockApiKeyData.hasApiKey = true;
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockConfirm.mockResolvedValue(true);
    mockDeleteApiKey.mockRejectedValue(new Error('Delete failed'));

    const { result } = renderHook(() => useApiKey(), { wrapper });

    await act(async () => {
      await result.current.handleDeleteApiKey();
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to delete API key:',
      expect.any(Error)
    );

    consoleSpy.mockRestore();
  });
});
