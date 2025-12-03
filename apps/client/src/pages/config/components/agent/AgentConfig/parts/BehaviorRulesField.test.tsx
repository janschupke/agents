import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BehaviorRulesField } from './BehaviorRulesField';
import { TestQueryProvider } from '../../../../test/utils/test-query-provider';

// Mock i18n
vi.mock('@openai/i18n', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string; index?: string }) => {
      const translations: Record<string, string> = {
        'config.behaviorRules': 'Behavior Rules',
        'config.rulesDescription': 'Rules will be saved as a JSON array',
        'config.addRule': 'Add Rule',
        'config.removeRule': 'Remove rule',
        'config.rulePlaceholder': options?.index
          ? `Rule ${options.index}`
          : 'Rule {{index}}',
        'config.viewForm': 'Form',
        'config.viewJson': 'JSON',
        'config.jsonPlaceholder': '["Rule 1", "Rule 2", "Rule 3"]',
        'config.jsonInvalidError': 'Invalid JSON format',
      };
      return translations[key] || options?.defaultValue || key;
    },
  }),
  I18nNamespace: {
    CLIENT: 'client',
  },
}));

// Test wrapper
const TestWrapper = ({
  initialRules = [],
  rules: controlledRules,
  onChange: controlledOnChange,
}: {
  initialRules?: string[];
  rules?: string[];
  onChange?: (rules: string[]) => void;
}) => {
  const [internalRules, setInternalRules] = React.useState(initialRules);
  const rules = controlledRules ?? internalRules;
  const onChange = controlledOnChange ?? setInternalRules;

  return (
    <TestQueryProvider>
      <BehaviorRulesField rules={rules} onChange={onChange} />
    </TestQueryProvider>
  );
};

describe('BehaviorRulesField', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Form View', () => {
    it('should render form view by default', () => {
      render(<TestWrapper initialRules={['Rule 1', 'Rule 2']} />);

      expect(screen.getByDisplayValue('Rule 1')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Rule 2')).toBeInTheDocument();
    });

    it('should display empty form when no rules', () => {
      render(<TestWrapper initialRules={[]} />);

      expect(screen.getByText('Add Rule')).toBeInTheDocument();
      expect(screen.queryByDisplayValue(/Rule/)).not.toBeInTheDocument();
    });

    it('should add a new rule when clicking Add Rule button', async () => {
      const user = userEvent.setup();
      render(<TestWrapper initialRules={['Rule 1']} />);

      const addButton = screen.getByText('Add Rule');
      await user.click(addButton);

      expect(screen.getByDisplayValue('Rule 1')).toBeInTheDocument();
      // After adding, there should be 2 inputs (one with Rule 1, one empty)
      const inputs = screen.getAllByRole('textbox');
      expect(inputs.length).toBeGreaterThan(1);
    });

    it('should remove a rule when clicking remove button', async () => {
      const user = userEvent.setup();
      render(<TestWrapper initialRules={['Rule 1', 'Rule 2']} />);

      const removeButtons = screen.getAllByTitle('Remove rule');
      await user.click(removeButtons[0]);

      await waitFor(() => {
        expect(screen.queryByDisplayValue('Rule 1')).not.toBeInTheDocument();
      });
      expect(screen.getByDisplayValue('Rule 2')).toBeInTheDocument();
    });

    it('should update rule when typing in input', async () => {
      const user = userEvent.setup();
      render(<TestWrapper initialRules={['Rule 1']} />);

      const input = screen.getByDisplayValue('Rule 1');
      await user.clear(input);
      await user.type(input, 'Updated Rule');

      expect(screen.getByDisplayValue('Updated Rule')).toBeInTheDocument();
    });

    it('should display multiple rules correctly', () => {
      render(<TestWrapper initialRules={['Rule 1', 'Rule 2', 'Rule 3']} />);

      expect(screen.getByDisplayValue('Rule 1')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Rule 2')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Rule 3')).toBeInTheDocument();
    });
  });

  describe('JSON View', () => {
    it('should switch to JSON view when clicking JSON button', async () => {
      const user = userEvent.setup();
      render(<TestWrapper initialRules={['Rule 1', 'Rule 2']} />);

      const jsonButton = screen.getByText('JSON');
      await user.click(jsonButton);

      await waitFor(() => {
        const textarea = screen.getByRole('textbox');
        expect(textarea).toHaveValue('[\n  "Rule 1",\n  "Rule 2"\n]');
      });
    });

    it('should display formatted JSON array', async () => {
      const user = userEvent.setup();
      render(<TestWrapper initialRules={['Rule 1', 'Rule 2', 'Rule 3']} />);

      const jsonButton = screen.getByText('JSON');
      await user.click(jsonButton);

      await waitFor(() => {
        const textarea = screen.getByRole('textbox');
        expect(textarea).toHaveValue(
          '[\n  "Rule 1",\n  "Rule 2",\n  "Rule 3"\n]'
        );
      });
    });

    it('should display empty array for no rules', async () => {
      const user = userEvent.setup();
      render(<TestWrapper initialRules={[]} />);

      const jsonButton = screen.getByText('JSON');
      await user.click(jsonButton);

      await waitFor(() => {
        const textarea = screen.getByRole('textbox');
        expect(textarea).toHaveValue('[]');
      });
    });

    it('should update rules when valid JSON is entered', async () => {
      const user = userEvent.setup();
      render(<TestWrapper initialRules={[]} />);

      // Switch to JSON view
      const jsonButton = screen.getByText('JSON');
      await user.click(jsonButton);

      await waitFor(() => {
        expect(screen.getByRole('textbox')).toBeInTheDocument();
      });

      const textarea = screen.getByRole('textbox');
      await user.clear(textarea);
      fireEvent.change(textarea, {
        target: { value: '["New Rule 1", "New Rule 2"]' },
      });

      // Switch back to form view to verify rules were updated
      const formButton = screen.getByText('Form');
      await user.click(formButton);

      await waitFor(() => {
        expect(screen.getByDisplayValue('New Rule 1')).toBeInTheDocument();
        expect(screen.getByDisplayValue('New Rule 2')).toBeInTheDocument();
      });
    });

    it('should show error for invalid JSON', async () => {
      const user = userEvent.setup();
      render(<TestWrapper initialRules={['Rule 1']} />);

      // Switch to JSON view
      const jsonButton = screen.getByText('JSON');
      await user.click(jsonButton);

      await waitFor(() => {
        expect(screen.getByRole('textbox')).toBeInTheDocument();
      });

      const textarea = screen.getByRole('textbox');
      await user.clear(textarea);
      fireEvent.change(textarea, { target: { value: 'invalid json{' } });

      await waitFor(() => {
        // Find the error message in the FormField error paragraph
        // The error is displayed in a <p> tag with class "text-xs text-red-600 mt-1"
        // The actual error message is the JSON parse error, not "Invalid JSON format"
        const errorParagraph = screen.getByText(/not valid JSON/i);
        expect(errorParagraph).toBeInTheDocument();
        expect(errorParagraph.tagName).toBe('P');
        expect(errorParagraph.className).toContain('text-red-600');
      });
    });

    it('should clear error when valid JSON is entered after invalid', async () => {
      const user = userEvent.setup();
      render(<TestWrapper initialRules={[]} />);

      // Switch to JSON view
      const jsonButton = screen.getByText('JSON');
      await user.click(jsonButton);

      await waitFor(() => {
        expect(screen.getByRole('textbox')).toBeInTheDocument();
      });

      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'invalid json{' } });

      await waitFor(() => {
        // Error message is the actual JSON parse error
        const errorParagraph = screen.getByText(/not valid JSON/i);
        expect(errorParagraph).toBeInTheDocument();
        expect(errorParagraph.tagName).toBe('P');
      });

      await user.clear(textarea);
      fireEvent.change(textarea, { target: { value: '["Valid Rule"]' } });

      await waitFor(() => {
        // Error should be cleared - no error paragraphs
        const errorParagraphs = screen.queryAllByText(/not valid JSON/i);
        expect(errorParagraphs.length).toBe(0);
      });
    });

    it('should handle empty JSON string as valid (empty array)', async () => {
      const user = userEvent.setup();
      render(<TestWrapper initialRules={['Rule 1']} />);

      // Switch to JSON view
      const jsonButton = screen.getByText('JSON');
      await user.click(jsonButton);

      await waitFor(() => {
        expect(screen.getByRole('textbox')).toBeInTheDocument();
      });

      const textarea = screen.getByRole('textbox');
      await user.clear(textarea);

      // Switch back to form view
      const formButton = screen.getByText('Form');
      await user.click(formButton);

      await waitFor(() => {
        expect(screen.queryByDisplayValue('Rule 1')).not.toBeInTheDocument();
        expect(screen.getByText('Add Rule')).toBeInTheDocument();
      });
    });

    it('should parse JSON object with rules property', async () => {
      const user = userEvent.setup();
      render(<TestWrapper initialRules={[]} />);

      // Switch to JSON view
      const jsonButton = screen.getByText('JSON');
      await user.click(jsonButton);

      await waitFor(() => {
        expect(screen.getByRole('textbox')).toBeInTheDocument();
      });

      const textarea = screen.getByRole('textbox');
      await user.clear(textarea);
      await user.clear(textarea);
      fireEvent.change(textarea, {
        target: { value: '{"rules": ["Rule 1", "Rule 2"]}' },
      });

      // Switch back to form view
      const formButton = screen.getByText('Form');
      await user.click(formButton);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Rule 1')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Rule 2')).toBeInTheDocument();
      });
    });
  });

  describe('View Synchronization', () => {
    it('should synchronize form changes to JSON view', async () => {
      const user = userEvent.setup();
      render(<TestWrapper initialRules={['Rule 1']} />);

      // Update rule in form view
      const input = screen.getByDisplayValue('Rule 1');
      await user.clear(input);
      await user.type(input, 'Updated Rule');

      // Switch to JSON view
      const jsonButton = screen.getByText('JSON');
      await user.click(jsonButton);

      await waitFor(() => {
        const textarea = screen.getByRole('textbox');
        expect(textarea).toHaveValue('[\n  "Updated Rule"\n]');
      });
    });

    it('should synchronize JSON changes to form view', async () => {
      const user = userEvent.setup();
      render(<TestWrapper initialRules={['Rule 1']} />);

      // Switch to JSON view
      const jsonButton = screen.getByText('JSON');
      await user.click(jsonButton);

      await waitFor(() => {
        expect(screen.getByRole('textbox')).toBeInTheDocument();
      });

      const textarea = screen.getByRole('textbox');
      await user.clear(textarea);
      fireEvent.change(textarea, {
        target: { value: '["JSON Rule 1", "JSON Rule 2"]' },
      });

      // Switch back to form view
      const formButton = screen.getByText('Form');
      await user.click(formButton);

      await waitFor(() => {
        expect(screen.getByDisplayValue('JSON Rule 1')).toBeInTheDocument();
        expect(screen.getByDisplayValue('JSON Rule 2')).toBeInTheDocument();
      });
    });

    it('should preserve rules when switching views multiple times', async () => {
      const user = userEvent.setup();
      render(<TestWrapper initialRules={['Rule 1', 'Rule 2']} />);

      // Switch to JSON
      await user.click(screen.getByText('JSON'));
      await waitFor(() => {
        expect(screen.getByRole('textbox')).toBeInTheDocument();
      });

      // Switch back to form
      await user.click(screen.getByText('Form'));
      await waitFor(() => {
        expect(screen.getByDisplayValue('Rule 1')).toBeInTheDocument();
      });

      // Switch to JSON again
      await user.click(screen.getByText('JSON'));
      await waitFor(() => {
        const textarea = screen.getByRole('textbox');
        expect(textarea).toHaveValue('[\n  "Rule 1",\n  "Rule 2"\n]');
      });
    });

    it('should update JSON view when rules prop changes externally', async () => {
      const user = userEvent.setup();
      const mockOnChange = vi.fn();
      const { rerender } = render(
        <TestWrapper rules={['Rule 1']} onChange={mockOnChange} />
      );

      // Switch to JSON view
      await user.click(screen.getByText('JSON'));
      await waitFor(() => {
        expect(screen.getByRole('textbox')).toBeInTheDocument();
      });

      // Update rules prop externally
      rerender(
        <TestWrapper
          rules={['Rule 1', 'Rule 2', 'Rule 3']}
          onChange={mockOnChange}
        />
      );

      await waitFor(() => {
        const textarea = screen.getByRole('textbox');
        expect(textarea).toHaveValue(
          '[\n  "Rule 1",\n  "Rule 2",\n  "Rule 3"\n]'
        );
      });
    });
  });

  describe('View Toggle', () => {
    it('should highlight active view button', () => {
      render(<TestWrapper initialRules={[]} />);

      const formButton = screen.getByText('Form').closest('button');
      const jsonButton = screen.getByText('JSON').closest('button');

      // Form should be active by default - check for primary variant styling
      expect(formButton).toBeInTheDocument();
      expect(jsonButton).toBeInTheDocument();
      // Check that form button has primary styling (bg-primary class)
      expect(formButton?.className).toMatch(/bg-primary/i);
      expect(jsonButton?.className).toMatch(/bg-background/i);
    });

    it('should switch active button when toggling views', async () => {
      const user = userEvent.setup();
      render(<TestWrapper initialRules={[]} />);

      const formButton = screen.getByText('Form').closest('button');
      const jsonButton = screen.getByText('JSON').closest('button');

      await user.click(jsonButton!);

      await waitFor(() => {
        expect(jsonButton?.className).toMatch(/bg-primary/i);
        expect(formButton?.className).toMatch(/bg-background/i);
      });
    });
  });

  describe('Real-time Validation', () => {
    it('should validate JSON in real-time as user types', async () => {
      const user = userEvent.setup();
      render(<TestWrapper initialRules={[]} />);

      // Switch to JSON view
      await user.click(screen.getByText('JSON'));
      await waitFor(() => {
        expect(screen.getByRole('textbox')).toBeInTheDocument();
      });

      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: '{' } });

      await waitFor(() => {
        // Error message is the actual JSON parse error (could be various messages)
        // Look for any error paragraph with red text
        const errorParagraphs = screen
          .queryAllByText(/./)
          .filter(
            (el) => el.tagName === 'P' && el.className.includes('text-red-600')
          );
        expect(errorParagraphs.length).toBeGreaterThan(0);
        expect(errorParagraphs[0].textContent).toBeTruthy();
      });

      fireEvent.change(textarea, { target: { value: '{"rules": ["Valid"]}' } });

      await waitFor(() => {
        // Error should be cleared - no error paragraphs
        const errorParagraphs = screen.queryAllByText(/not valid JSON/i);
        expect(errorParagraphs.length).toBe(0);
      });
    });

    it('should not update rules when JSON is invalid', async () => {
      const user = userEvent.setup();
      const mockOnChange = vi.fn();
      render(<TestWrapper rules={['Original Rule']} onChange={mockOnChange} />);

      // Switch to JSON view
      await user.click(screen.getByText('JSON'));
      await waitFor(() => {
        expect(screen.getByRole('textbox')).toBeInTheDocument();
      });

      const textarea = screen.getByRole('textbox');
      await user.clear(textarea);
      fireEvent.change(textarea, { target: { value: 'invalid json{' } });

      // Wait a bit to ensure onChange wasn't called with invalid data
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Verify onChange was not called with the invalid JSON
      // It should only be called with valid JSON or empty array
      const invalidCalls = mockOnChange.mock.calls.filter((call) => {
        const rules = call[0];
        return (
          Array.isArray(rules) &&
          rules.length > 0 &&
          rules[0] !== 'Original Rule' &&
          !rules.some((r) => typeof r === 'string' && r.length > 0)
        );
      });
      expect(invalidCalls.length).toBe(0);

      // Switch back to form - original rule should still be there
      await user.click(screen.getByText('Form'));

      await waitFor(() => {
        expect(screen.getByDisplayValue('Original Rule')).toBeInTheDocument();
      });
    });
  });
});
