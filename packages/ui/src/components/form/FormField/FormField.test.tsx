import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import FormField from './FormField';

describe('FormField', () => {
  it('should render children', () => {
    render(
      <FormField>
        <input />
      </FormField>
    );
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('should render label', () => {
    render(
      <FormField label="Test Label">
        <input />
      </FormField>
    );
    expect(screen.getByText('Test Label')).toBeInTheDocument();
  });

  it('should render error when touched and error exists', () => {
    render(
      <FormField label="Test" error="Error message" touched>
        <input />
      </FormField>
    );
    expect(screen.getByText('Error message')).toBeInTheDocument();
  });

  it('should not render error when not touched', () => {
    render(
      <FormField label="Test" error="Error message" touched={false}>
        <input />
      </FormField>
    );
    expect(screen.queryByText('Error message')).not.toBeInTheDocument();
  });

  it('should render hint when no error', () => {
    render(
      <FormField label="Test" hint="Helpful hint">
        <input />
      </FormField>
    );
    expect(screen.getByText('Helpful hint')).toBeInTheDocument();
  });

  it('should not render hint when error is shown', () => {
    render(
      <FormField label="Test" error="Error" hint="Hint" touched>
        <input />
      </FormField>
    );
    expect(screen.queryByText('Hint')).not.toBeInTheDocument();
    expect(screen.getByText('Error')).toBeInTheDocument();
  });

  it('should show required indicator', () => {
    render(
      <FormField label="Test" required>
        <input />
      </FormField>
    );
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('should associate label with input via labelFor', () => {
    render(
      <FormField label="Test" labelFor="test-input">
        <input id="test-input" />
      </FormField>
    );
    const label = screen.getByText('Test');
    expect(label).toHaveAttribute('for', 'test-input');
  });
});
