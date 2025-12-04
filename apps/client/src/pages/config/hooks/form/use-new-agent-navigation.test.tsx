import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useNewAgentNavigation } from './use-new-agent-navigation';
import { ROUTES } from '../../../../constants/routes.constants';
import { TestQueryProvider } from '../../../../test/utils/test-query-provider';
import { Agent } from '../../../../types/chat.types';
import { createMockAgent } from '../../../../test/utils/mock-factories';

// Mock dependencies
const mockNavigate = vi.fn();
const mockConfirm = vi.fn();
const mockCreateAgent = vi.fn();
const mockShowToast = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('../../../../hooks/mutations/use-agent-mutations', () => ({
  useCreateAgent: () => ({
    mutateAsync: mockCreateAgent,
  }),
}));

vi.mock('../../../../contexts/ToastContext', () => ({
  useToast: () => ({
    showToast: mockShowToast,
  }),
}));

vi.mock('@openai/i18n', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
  I18nNamespace: {
    CLIENT: 'client',
  },
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <TestQueryProvider>{children}</TestQueryProvider>
);

describe('useNewAgentNavigation', () => {
  const mockFormData: Partial<Agent> = {
    name: 'New Agent',
    description: 'New Description',
    avatarUrl: null,
    configs: {
      temperature: 0.7,
      system_prompt: 'Test prompt',
      behavior_rules: [],
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create agent and navigate on save', async () => {
    const savedAgent: Agent = createMockAgent({
      id: 1,
      name: 'New Agent',
      description: 'New Description',
      createdAt: '2024-01-01T00:00:00.000Z',
    });

    mockCreateAgent.mockResolvedValue(savedAgent);

    const { result } = renderHook(
      () =>
        useNewAgentNavigation({
          formData: mockFormData,
          navigate: mockNavigate,
          confirm: mockConfirm,
        }),
      { wrapper }
    );

    await act(async () => {
      await result.current.handleSave();
    });

    expect(mockCreateAgent).toHaveBeenCalledWith({
      name: 'New Agent',
      description: 'New Description',
      avatarUrl: undefined,
      configs: mockFormData.configs,
    });

    expect(mockShowToast).toHaveBeenCalledWith(
      'config.messages.agentCreated',
      'success'
    );
    expect(mockNavigate).toHaveBeenCalledWith(ROUTES.CONFIG_AGENT(1), {
      replace: true,
    });
  });

  it('should handle save errors', async () => {
    const error = new Error('Save failed');
    mockCreateAgent.mockRejectedValue(error);

    const { result } = renderHook(
      () =>
        useNewAgentNavigation({
          formData: mockFormData,
          navigate: mockNavigate,
          confirm: mockConfirm,
        }),
      { wrapper }
    );

    await act(async () => {
      await expect(result.current.handleSave()).rejects.toThrow();
    });

    expect(mockShowToast).toHaveBeenCalledWith('Save failed', 'error');
  });

  it('should navigate to config on cancel when no changes', async () => {
    const emptyFormData: Partial<Agent> = {
      name: '',
      description: null,
      avatarUrl: null,
      configs: {
        temperature: 1,
        system_prompt: '',
        behavior_rules: [],
      },
    };

    const { result } = renderHook(
      () =>
        useNewAgentNavigation({
          formData: emptyFormData,
          navigate: mockNavigate,
          confirm: mockConfirm,
        }),
      { wrapper }
    );

    await act(async () => {
      await result.current.handleCancel();
    });

    expect(mockConfirm).not.toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith(ROUTES.CONFIG);
  });

  it('should confirm before canceling when there are changes', async () => {
    mockConfirm.mockResolvedValue(true);

    const { result } = renderHook(
      () =>
        useNewAgentNavigation({
          formData: mockFormData,
          navigate: mockNavigate,
          confirm: mockConfirm,
        }),
      { wrapper }
    );

    await act(async () => {
      await result.current.handleCancel();
    });

    expect(mockConfirm).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith(ROUTES.CONFIG);
  });

  it('should not navigate if cancel is not confirmed', async () => {
    mockConfirm.mockResolvedValue(false);

    const { result } = renderHook(
      () =>
        useNewAgentNavigation({
          formData: mockFormData,
          navigate: mockNavigate,
          confirm: mockConfirm,
        }),
      { wrapper }
    );

    await act(async () => {
      await result.current.handleCancel();
    });

    expect(mockConfirm).toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
