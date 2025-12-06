import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LanguageField from './LanguageField';
import { Language } from '@openai/shared-types';
import { AgentType } from '../../../../../../types/agent.types';

// Mock i18n
const mockT = vi.fn((key: string) => {
  const translations: Record<string, string> = {
    'config.language.label': 'Language',
    'config.language.description': 'Optional language setting',
    'config.language.none': 'None (Default)',
    'config.language.chineseSimplified': 'Chinese (Simplified)',
    'config.language.chineseTraditional': 'Chinese (Traditional)',
    'config.language.japanese': 'Japanese',
    'config.language.korean': 'Korean',
    'config.language.spanish': 'Spanish',
    'config.language.french': 'French',
    'config.language.german': 'German',
    'config.language.italian': 'Italian',
    'config.language.portuguese': 'Portuguese',
    'config.language.russian': 'Russian',
  };
  return translations[key] || key;
});

vi.mock('@openai/i18n', () => ({
  useTranslation: () => ({
    t: mockT,
  }),
  I18nNamespace: {
    CLIENT: 'client',
  },
}));

// Mock language constants
vi.mock('../../../../../../constants/language.constants', () => ({
  getLanguageOptions: (t: (key: string) => string) => [
    { value: Language.CHINESE_SIMPLIFIED, label: t('config.language.chineseSimplified') },
    { value: Language.CHINESE_TRADITIONAL, label: t('config.language.chineseTraditional') },
    { value: Language.JAPANESE, label: t('config.language.japanese') },
    { value: Language.KOREAN, label: t('config.language.korean') },
    { value: Language.SPANISH, label: t('config.language.spanish') },
    { value: Language.FRENCH, label: t('config.language.french') },
    { value: Language.GERMAN, label: t('config.language.german') },
    { value: Language.ITALIAN, label: t('config.language.italian') },
    { value: Language.PORTUGUESE, label: t('config.language.portuguese') },
    { value: Language.RUSSIAN, label: t('config.language.russian') },
  ],
}));

// Mock FormField component
vi.mock('@openai/ui', () => ({
  FormField: ({
    label,
    labelFor,
    hint,
    error,
    touched,
    children,
  }: {
    label: string;
    labelFor: string;
    hint: string;
    error?: string | null;
    touched?: boolean;
    children: React.ReactNode;
  }) => (
    <div data-testid="form-field">
      <label htmlFor={labelFor}>{label}</label>
      {hint && <span data-testid="hint">{hint}</span>}
      {error && touched && <span data-testid="error">{error}</span>}
      {children}
    </div>
  ),
}));

describe('LanguageField', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render with label and description', () => {
    const mockOnChange = vi.fn();
    render(<LanguageField value={null} onChange={mockOnChange} />);

    expect(screen.getByText('Language')).toBeInTheDocument();
    expect(screen.getByTestId('hint')).toHaveTextContent('Optional language setting');
  });

  it('should render select dropdown', () => {
    const mockOnChange = vi.fn();
    render(<LanguageField value={null} onChange={mockOnChange} />);

    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
    expect(select).toHaveAttribute('id', 'agent-language');
  });

  it('should display "None (Default)" option', () => {
    const mockOnChange = vi.fn();
    render(<LanguageField value={null} onChange={mockOnChange} />);

    expect(screen.getByText('None (Default)')).toBeInTheDocument();
  });

  it('should display all language options', () => {
    const mockOnChange = vi.fn();
    render(<LanguageField value={null} onChange={mockOnChange} />);

    expect(screen.getByText('Chinese (Simplified)')).toBeInTheDocument();
    expect(screen.getByText('Chinese (Traditional)')).toBeInTheDocument();
    expect(screen.getByText('Japanese')).toBeInTheDocument();
    expect(screen.getByText('Korean')).toBeInTheDocument();
    expect(screen.getByText('Spanish')).toBeInTheDocument();
    expect(screen.getByText('French')).toBeInTheDocument();
    expect(screen.getByText('German')).toBeInTheDocument();
    expect(screen.getByText('Italian')).toBeInTheDocument();
    expect(screen.getByText('Portuguese')).toBeInTheDocument();
    expect(screen.getByText('Russian')).toBeInTheDocument();
  });

  it('should have correct option values', () => {
    const mockOnChange = vi.fn();
    render(<LanguageField value={null} onChange={mockOnChange} />);

    const select = screen.getByRole('combobox') as HTMLSelectElement;
    
    expect(select.options[0].value).toBe('');
    expect(select.options[1].value).toBe(Language.CHINESE_SIMPLIFIED);
    expect(select.options[2].value).toBe(Language.CHINESE_TRADITIONAL);
    expect(select.options[3].value).toBe(Language.JAPANESE);
  });

  it('should call onChange when language is selected', async () => {
    const user = userEvent.setup();
    const mockOnChange = vi.fn();
    render(<LanguageField value={null} onChange={mockOnChange} />);

    const select = screen.getByRole('combobox');
    await user.selectOptions(select, Language.JAPANESE);

    expect(mockOnChange).toHaveBeenCalledWith(Language.JAPANESE);
  });

  it('should call onChange with null when "None" is selected', async () => {
    const user = userEvent.setup();
    const mockOnChange = vi.fn();
    render(<LanguageField value={Language.JAPANESE} onChange={mockOnChange} />);

    const select = screen.getByRole('combobox');
    await user.selectOptions(select, '');

    expect(mockOnChange).toHaveBeenCalledWith(null);
  });

  it('should display selected value', () => {
    const mockOnChange = vi.fn();
    render(<LanguageField value={Language.SPANISH} onChange={mockOnChange} />);

    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select.value).toBe(Language.SPANISH);
  });

  it('should display empty value when value is null', () => {
    const mockOnChange = vi.fn();
    render(<LanguageField value={null} onChange={mockOnChange} />);

    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select.value).toBe('');
  });

  it('should display error when error and touched are provided', () => {
    const mockOnChange = vi.fn();
    render(
      <LanguageField
        value={null}
        onChange={mockOnChange}
        error="Language is required"
        touched={true}
      />
    );

    expect(screen.getByTestId('error')).toHaveTextContent('Language is required');
  });

  it('should not display error when touched is false', () => {
    const mockOnChange = vi.fn();
    render(
      <LanguageField
        value={null}
        onChange={mockOnChange}
        error="Language is required"
        touched={false}
      />
    );

    expect(screen.queryByTestId('error')).not.toBeInTheDocument();
  });

  it('should not display error when error is null', () => {
    const mockOnChange = vi.fn();
    render(
      <LanguageField
        value={null}
        onChange={mockOnChange}
        error={null}
        touched={true}
      />
    );

    expect(screen.queryByTestId('error')).not.toBeInTheDocument();
  });

  it('should be enabled by default', () => {
    const mockOnChange = vi.fn();
    render(<LanguageField value={null} onChange={mockOnChange} />);

    const select = screen.getByRole('combobox');
    expect(select).not.toBeDisabled();
  });

  it('should work with different agent types', () => {
    const mockOnChange = vi.fn();
    const { rerender } = render(
      <LanguageField
        value={null}
        onChange={mockOnChange}
        agentType={AgentType.GENERAL}
      />
    );

    expect(screen.getByRole('combobox')).toBeInTheDocument();

    rerender(
      <LanguageField
        value={null}
        onChange={mockOnChange}
        agentType={AgentType.LANGUAGE_ASSISTANT}
      />
    );

    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });
});
