import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ValidatedInput from './ValidatedInput';

describe('ValidatedInput', () => {
  it('should render input', () => {
    render(<ValidatedInput />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('should render error when touched and error exists', () => {
    render(<ValidatedInput error="Error message" touched />);
    expect(screen.getByText('Error message')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveClass('border-red-500');
  });

  it('should not render error when not touched', () => {
    render(<ValidatedInput error="Error message" touched={false} />);
    expect(screen.queryByText('Error message')).not.toBeInTheDocument();
  });

  it('should call onBlur when input loses focus', async () => {
    const user = userEvent.setup();
    const handleBlur = vi.fn();

    render(<ValidatedInput onBlur={handleBlur} />);
    const input = screen.getByRole('textbox');

    await user.click(input);
    await user.tab();

    expect(handleBlur).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when disabled prop is true', () => {
    render(<ValidatedInput disabled />);
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('should not show error when showError is false', () => {
    render(<ValidatedInput error="Error message" touched showError={false} />);
    expect(screen.queryByText('Error message')).not.toBeInTheDocument();
  });
});
